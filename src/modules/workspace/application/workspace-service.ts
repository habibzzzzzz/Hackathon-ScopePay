import type {
  ChangeOrder,
  Entities,
  Profile,
  Table,
  Workspace,
} from "../domain/entities";
import type { RuntimePorts } from "./ports";
import type { Command } from "./validation";
import { scopeResultSchema, projectReviewSchema } from "./validation";
import { ApplicationError } from "@/shared/errors/application-error";
import {
  assertTokenActive,
  assertTransition,
} from "@/modules/change-orders/domain/policy";
import { calculateRecommendedCharge } from "@/modules/payments/domain/pricing";
type InputFor<A extends Command["action"]> = Extract<Command, { action: A }>;
const tokenLifetimeMs = 7 * 86400000;

export class WorkspaceService {
  constructor(private readonly ports: RuntimePorts) {}
  private base(userId: string) {
    return { id: this.ports.newId(), userId, createdAt: this.ports.now() };
  }
  private async owned<K extends Table>(
    table: K,
    id: string,
    userId: string,
  ): Promise<Entities[K]> {
    const entity = await this.ports.repository.get(table, id, userId);
    if (!entity)
      throw new ApplicationError(
        "NOT_FOUND",
        "This record is unavailable.",
        404,
      );
    return entity;
  }
  private async log(
    userId: string,
    projectId: string | null,
    eventType: string,
    description: string,
  ) {
    await this.ports.repository.save("activity_logs", {
      ...this.base(userId),
      projectId,
      eventType,
      description,
    });
  }
  async workspace(userId: string): Promise<Workspace> {
    const r = this.ports.repository;
    const [
      profiles,
      clients,
      projects,
      analyses,
      orders,
      invoices,
      activity,
      reviews,
    ] = await Promise.all([
      r.list("profiles", userId),
      r.list("clients", userId),
      r.list("projects", userId),
      r.list("analyses", userId),
      r.list("change_orders", userId),
      r.list("invoices", userId),
      r.list("activity_logs", userId),
      r.list("project_reviews", userId),
    ]);
    return {
      profile: profiles[0] ?? null,
      clients,
      projects,
      analyses,
      orders,
      invoices,
      activity,
      reviews,
    };
  }
  async execute(
    userId: string,
    email: string,
    command: Command,
  ): Promise<unknown> {
    switch (command.action) {
      case "profile":
        return this.saveProfile(userId, email, command);
      case "client":
        return this.createClient(userId, command);
      case "project":
        return this.createProject(userId, command);
      case "baseline":
        return this.updateBaseline(userId, command);
      case "project-review":
        return this.reviewProject(userId, command.id);
      case "analyze":
        return this.analyzeClientRequest(userId, command);
      case "order":
        return this.createChangeOrder(userId, command);
      case "send":
        return this.sendChangeOrder(userId, command.id);
      case "cancel":
        return this.cancelChangeOrder(userId, command.id);
      case "revoke":
        return this.revokeLink(userId, command.id);
      case "invoice":
        return this.createInvoice(
          await this.owned("change_orders", command.id, userId),
        );
    }
  }
  private async saveProfile(
    userId: string,
    email: string,
    command: InputFor<"profile">,
  ) {
    const existing = await this.ports.repository.get(
      "profiles",
      userId,
      userId,
    );
    const profile: Profile = {
      ...(existing ?? this.base(userId)),
      ...command.input,
      id: userId,
      email,
    };
    await this.ports.repository.save("profiles", profile);
    return profile;
  }
  private async createClient(userId: string, command: InputFor<"client">) {
    const client = { ...this.base(userId), ...command.input };
    await this.ports.repository.save("clients", client);
    return client;
  }
  private async createProject(userId: string, command: InputFor<"project">) {
    await this.owned("profiles", userId, userId);
    await this.owned("clients", command.input.clientId, userId);
    const project = { ...this.base(userId), ...command.input };
    await this.ports.repository.save("projects", project);
    await this.log(
      userId,
      project.id,
      "PROJECT_CREATED",
      `Created ${project.name}.`,
    );
    return project;
  }
  private async updateBaseline(userId: string, command: InputFor<"baseline">) {
    const project = await this.owned("projects", command.id, userId);
    await this.owned("clients", command.input.clientId, userId);
    const hasOrders = (
      await this.ports.repository.list("change_orders", userId)
    ).some((o) => o.projectId === project.id);
    if (
      hasOrders &&
      (command.input.currency !== project.currency ||
        command.input.clientId !== project.clientId)
    )
      throw new ApplicationError(
        "PROJECT_LOCKED",
        "Client and currency cannot change after a change order exists.",
        409,
      );
    const updated = { ...project, ...command.input };
    await this.ports.repository.save("projects", updated);
    await this.log(
      userId,
      project.id,
      "BASELINE_UPDATED",
      "Updated project baseline. Previous analyses retain their snapshots.",
    );
    return updated;
  }
  private async reviewProject(userId: string, projectId: string) {
    await this.ports.repository.rateLimit(`analysis:${userId}`, 10, 60);
    const project = await this.owned("projects", projectId, userId);
    const result = projectReviewSchema.parse(
      await this.ports.analyzer.review(project),
    );
    const review = {
      ...this.base(userId),
      projectId,
      baseline: project,
      result,
      provider: this.ports.analyzer.name,
    };
    await this.ports.repository.save("project_reviews", review);
    await this.log(
      userId,
      projectId,
      "PROJECT_ANALYZED",
      "Reviewed the project baseline for commercial ambiguities.",
    );
    return review;
  }
  private async analyzeClientRequest(
    userId: string,
    command: InputFor<"analyze">,
  ) {
    const r = this.ports.repository;
    await r.rateLimit(`analysis:${userId}`, 10, 60);
    const project = await this.owned(
      "projects",
      command.input.projectId,
      userId,
    );
    const profile = await this.owned("profiles", userId, userId);
    if (project.currency !== profile.currency)
      throw new ApplicationError(
        "CURRENCY_MISMATCH",
        "Set your pricing currency to match this project before analyzing.",
      );
    const result = scopeResultSchema.parse(
      await this.ports.analyzer.analyze(project, command.input.requestText),
    );
    const billable = ["OUT_OF_SCOPE", "PARTIALLY_OUT_OF_SCOPE"].includes(
      result.classification,
    );
    const pricing = calculateRecommendedCharge({
      hoursMin: billable ? result.hoursMin : 0,
      hoursMax: billable ? result.hoursMax : 0,
      hourlyRateMinor: profile.hourlyRateMinor,
      minimumChargeMinor: billable ? profile.minimumChargeMinor : 0,
      riskPercent: profile.riskPercent,
      urgencyPercent: profile.urgencyPercent,
    });
    const analysis = {
      ...this.base(userId),
      projectId: project.id,
      baseline: project,
      requestText: command.input.requestText,
      result,
      pricing,
      provider: this.ports.analyzer.name,
    };
    await r.save("analyses", analysis);
    await this.log(
      userId,
      project.id,
      "ANALYSIS_GENERATED",
      `Assessment: ${result.classification.toLowerCase().replaceAll("_", " ")}.`,
    );
    return analysis;
  }
  private async createChangeOrder(userId: string, command: InputFor<"order">) {
    const project = await this.owned(
      "projects",
      command.input.projectId,
      userId,
    );
    const analysis = command.input.analysisId
      ? await this.owned("analyses", command.input.analysisId, userId)
      : null;
    if (analysis) {
      if (analysis.projectId !== project.id)
        throw new ApplicationError(
          "ANALYSIS_MISMATCH",
          "The analysis belongs to another project.",
        );
      if (
        !analysis.baseline ||
        (
          [
            "includedScope",
            "excludedScope",
            "deliverables",
            "revisionPolicy",
            "contractText",
          ] as const
        ).some((key) => analysis.baseline[key] !== project[key])
      )
        throw new ApplicationError(
          "BASELINE_CHANGED",
          "The baseline changed after this assessment. Analyze the request again before creating a draft.",
          409,
        );
      if (
        !["OUT_OF_SCOPE", "PARTIALLY_OUT_OF_SCOPE"].includes(
          analysis.result.classification,
        )
      )
        throw new ApplicationError(
          "REVIEW_REQUIRED",
          "Clarify this request before creating a billable change order.",
        );
    }
    const id = this.ports.newId();
    const order: ChangeOrder = {
      ...this.base(userId),
      ...command.input,
      id,
      number: `CHG-${id.slice(0, 8).toUpperCase()}`,
      currency: project.currency,
      status: "DRAFT",
      tokenHash: null,
      tokenExpiresAt: null,
      tokenRevokedAt: null,
      approvedAt: null,
    };
    await this.ports.repository.save("change_orders", order);
    if (analysis && analysis.pricing.recommendedMinor !== order.amountMinor)
      await this.log(
        userId,
        project.id,
        "PRICE_OVERRIDDEN",
        `Freelancer adjusted the recommendation for ${order.number}.`,
      );
    await this.log(
      userId,
      project.id,
      "CHANGE_ORDER_CREATED",
      `Created ${order.number} for freelancer review.`,
    );
    return order;
  }
  private async sendChangeOrder(userId: string, id: string) {
    const order = await this.owned("change_orders", id, userId);
    assertTransition(order.status, "SENT");
    const token = this.ports.newToken();
    const updated = {
      ...order,
      status: "SENT" as const,
      tokenHash: this.ports.hashToken(token),
      tokenExpiresAt: new Date(
        Date.parse(this.ports.now()) + tokenLifetimeMs,
      ).toISOString(),
    };
    await this.ports.repository.transition(updated, order.status);
    return { token, expiresAt: updated.tokenExpiresAt };
  }
  private async cancelChangeOrder(userId: string, id: string) {
    const order = await this.owned("change_orders", id, userId);
    assertTransition(order.status, "CANCELLED");
    return this.ports.repository.transition(
      { ...order, status: "CANCELLED", tokenRevokedAt: this.ports.now() },
      order.status,
    );
  }
  private async revokeLink(userId: string, id: string) {
    const order = await this.owned("change_orders", id, userId);
    return this.ports.repository.transition(
      { ...order, tokenRevokedAt: this.ports.now() },
      order.status,
    );
  }
  private async createInvoice(order: ChangeOrder) {
    const { repository: r, gateway } = this.ports;
    const existing = (await r.list("invoices", order.userId)).find(
      (i) => i.changeOrderId === order.id,
    );
    if (existing && existing.status !== "DRAFT") return existing;
    if (order.status !== "APPROVED")
      throw new ApplicationError(
        "APPROVAL_REQUIRED",
        "Client approval is required before invoicing.",
        409,
      );
    if (
      this.ports.invoiceSellerId &&
      this.ports.invoiceSellerId !== order.userId
    )
      throw new ApplicationError(
        "SELLER_NOT_CONFIGURED",
        "PayPal invoicing is enabled only for the configured hackathon seller.",
        403,
      );
    const project = await this.owned("projects", order.projectId, order.userId);
    const client = await this.owned("clients", project.clientId, order.userId);
    const seller = await this.owned("profiles", order.userId, order.userId);
    let invoice = existing;
    if (!invoice) {
      const draft = await gateway.create(order, client, seller);
      invoice = {
        ...this.base(order.userId),
        projectId: project.id,
        changeOrderId: order.id,
        paypalInvoiceId: draft.id,
        number: draft.number,
        amountMinor: order.amountMinor,
        paidMinor: 0,
        currency: order.currency,
        status: "DRAFT",
        payerViewUrl: "",
        sentAt: null,
        paidAt: null,
      };
      invoice = await r.attachInvoice(order, invoice);
    }
    const sent = await gateway.send(invoice.paypalInvoiceId);
    return r.attachInvoice(order, {
      ...invoice,
      status: "SENT",
      payerViewUrl: sent.payerViewUrl,
      sentAt: this.ports.now(),
    });
  }
  async publicOrder(token: string, markViewed = true) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(token))
      throw new ApplicationError(
        "LINK_UNAVAILABLE",
        "This approval link is unavailable.",
        404,
      );
    const { repository: r } = this.ports;
    await r.rateLimit(`public:${this.ports.hashToken(token)}`, 60, 60);
    let order = await r.findPublicOrder(this.ports.hashToken(token));
    if (!order)
      throw new ApplicationError(
        "LINK_UNAVAILABLE",
        "This approval link is unavailable.",
        404,
      );
    assertTokenActive(order.tokenExpiresAt, order.tokenRevokedAt);
    if (markViewed && order.status === "SENT")
      order = await r.transition({ ...order, status: "VIEWED" }, "SENT");
    const project = await this.owned("projects", order.projectId, order.userId);
    const seller = await this.owned("profiles", order.userId, order.userId);
    const invoice = (await r.list("invoices", order.userId)).find(
      (i) => i.changeOrderId === order.id,
    );
    return { order, project, seller, invoice };
  }
  async decide(token: string, decision: "approve" | "reject") {
    let { order } = await this.publicOrder(token, false);
    if (decision === "reject" && order.status === "REJECTED")
      return { status: "REJECTED" };
    if (
      decision === "approve" &&
      ["APPROVED", "INVOICED", "PAID"].includes(order.status)
    )
      return this.createInvoice(order);
    const next = decision === "approve" ? "APPROVED" : "REJECTED";
    assertTransition(order.status, next);
    order = await this.ports.repository.transition(
      {
        ...order,
        status: next,
        approvedAt: next === "APPROVED" ? this.ports.now() : null,
      },
      order.status,
    );
    return decision === "approve"
      ? this.createInvoice(order)
      : { status: "REJECTED" };
  }
  async processPayment(
    eventId: string,
    eventType: string,
    invoiceId: string,
    occurredAt: string,
  ) {
    const snapshot = await this.ports.gateway.read(invoiceId);
    await this.ports.repository.reconcile({
      ...snapshot,
      eventId,
      eventType,
      occurredAt,
    });
  }
}
