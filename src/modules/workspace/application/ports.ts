import type {
  Analysis,
  ChangeOrder,
  Entities,
  Invoice,
  Profile,
  Project,
  ScopeResult,
  Table,
} from "../domain/entities";

export interface WorkspaceRepository {
  list<K extends Table>(table: K, userId: string): Promise<Entities[K][]>;
  get<K extends Table>(
    table: K,
    id: string,
    userId: string,
  ): Promise<Entities[K] | null>;
  save<K extends Table>(table: K, entity: Entities[K]): Promise<void>;
  findPublicOrder(tokenHash: string): Promise<ChangeOrder | null>;
  transition(
    order: ChangeOrder,
    previousStatus: ChangeOrder["status"],
  ): Promise<ChangeOrder>;
  attachInvoice(order: ChangeOrder, invoice: Invoice): Promise<Invoice>;
  reconcile(event: PaymentEvent): Promise<void>;
  rateLimit(key: string, limit: number, windowSeconds: number): Promise<void>;
}
export interface ScopeAnalyzer {
  review(
    project: Project,
  ): Promise<import("../domain/entities").ProjectReviewResult>;
  readonly name: string;
  analyze(project: Project, request: string): Promise<ScopeResult>;
}
export interface InvoiceGateway {
  create(
    order: ChangeOrder,
    recipient: { name: string; email: string },
    seller: Profile,
  ): Promise<{ id: string; number: string }>;
  send(id: string): Promise<{ payerViewUrl: string }>;
  read(id: string): Promise<InvoiceSnapshot>;
}
export interface InvoiceSnapshot {
  id: string;
  status: Invoice["status"];
  amountMinor: number;
  paidMinor: number;
  currency: Invoice["currency"];
}
export interface PaymentEvent extends InvoiceSnapshot {
  eventId: string;
  eventType: string;
  occurredAt: string;
}
export interface WebhookVerifier {
  verify(headers: Headers, event: unknown): Promise<boolean>;
}
export interface RuntimePorts {
  repository: WorkspaceRepository;
  analyzer: ScopeAnalyzer;
  gateway: InvoiceGateway;
  newId(): string;
  now(): string;
  newToken(): string;
  hashToken(token: string): string;
  invoiceSellerId?: string;
}
export type AnalysisWithProject = Analysis & { project: Project };
