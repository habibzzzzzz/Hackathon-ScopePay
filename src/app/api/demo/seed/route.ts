import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";
import { requireSession } from "@/shared/infrastructure/auth";
import { runtime } from "@/shared/infrastructure/runtime";
import { assertOrigin, errorResponse } from "@/shared/presentation/http";
import { ApplicationError } from "@/shared/errors/application-error";
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    if (env().APP_MODE !== "demo")
      throw new ApplicationError(
        "DEMO_DISABLED",
        "Demo fixtures are unavailable.",
        404,
      );
    const user = await requireSession();
    const { service, repository } = await runtime();
    const workspace = await service.workspace(user.id);
    if (workspace.projects.length)
      return NextResponse.json({
        data: { id: workspace.projects[0].id },
        error: null,
      });
    const clientId = crypto.randomUUID();
    const projectId = crypto.randomUUID();
    const now = new Date().toISOString();
    await repository.save("clients", {
      id: clientId,
      userId: user.id,
      createdAt: now,
      name: "HAVN Coffee (demo)",
      company: "HAVN Coffee",
      email: "client@example.com",
      phone: "",
      notes: "Fictional client from the PRD demonstration scenario.",
    });
    await repository.save("projects", {
      id: projectId,
      userId: user.id,
      createdAt: now,
      clientId,
      name: "HAVN Coffee Website",
      description: "PRD demonstration project. All values are sample data.",
      currency: "USD",
      originalValueMinor: 150000,
      startDate: "2026-10-08",
      dueDate: "2026-10-28",
      status: "ACTIVE",
      includedScope:
        "Landing page\nDigital menu\nReservation form\nAdmin dashboard",
      excludedScope: "Social authentication\nPDF reports",
      deliverables: "Responsive website and admin dashboard",
      revisionPolicy: "Two rounds of revisions to agreed deliverables.",
      contractText: "",
    });
    return NextResponse.json({ data: { id: projectId }, error: null });
  } catch (error) {
    return errorResponse(error);
  }
}
