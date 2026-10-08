import { NextResponse } from "next/server";
import { requireSession } from "@/shared/infrastructure/auth";
import { runtime } from "@/shared/infrastructure/runtime";
import { commandInput } from "@/modules/workspace/application/validation";
import {
  assertOrigin,
  errorResponse,
  readJson,
} from "@/shared/presentation/http";

export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireSession();
    const command = commandInput.parse(await readJson(request));
    const { service } = await runtime();
    return NextResponse.json(
      {
        data: await service.execute(user.id, user.email, command),
        error: null,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return errorResponse(error);
  }
}
