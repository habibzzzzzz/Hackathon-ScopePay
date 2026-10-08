import { NextResponse } from "next/server";
import { z } from "zod";
import { runtime } from "@/shared/infrastructure/runtime";
import { assertOrigin, errorResponse, readJson } from "@/shared/presentation/http";

export async function POST(request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    assertOrigin(request);
    const { decision } = z.object({ decision: z.enum(["approve", "reject"]) }).parse(await readJson(request, 1000));
    const { token } = await context.params;
    const { service } = await runtime(true);
    const result = await service.decide(token, decision);
    return NextResponse.json({ data: { status: result.status, payerViewUrl: "payerViewUrl" in result ? result.payerViewUrl : null }, error: null });
  } catch (error) { return errorResponse(error); }
}
