import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/shared/config/env";
import { ApplicationError } from "@/shared/errors/application-error";

export function assertOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(env().NEXT_PUBLIC_APP_URL).origin)
    throw new ApplicationError(
      "INVALID_ORIGIN",
      "This request origin is not allowed.",
      403,
    );
}
export async function readJson(
  request: Request,
  maxBytes = 100000,
): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > maxBytes)
    throw new ApplicationError("INPUT_TOO_LARGE", "Request is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader)
    throw new ApplicationError("INVALID_INPUT", "Request body is required.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytes += value.length;
    if (bytes > maxBytes) {
      await reader.cancel();
      throw new ApplicationError(
        "INPUT_TOO_LARGE",
        "Request is too large.",
        413,
      );
    }
    chunks.push(value);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApplicationError("INVALID_INPUT", "Enter valid JSON.");
  }
}
export function errorResponse(error: unknown) {
  if (error instanceof z.ZodError)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: error.issues
            .map((i) => i.message)
            .slice(0, 3)
            .join(" "),
        },
      },
      { status: 400 },
    );
  if (error instanceof ApplicationError)
    return NextResponse.json(
      { data: null, error: { code: error.code, message: error.message } },
      { status: error.status },
    );
  console.error(
    JSON.stringify({
      event: "request_failed",
      errorType: error instanceof Error ? error.name : "unknown",
    }),
  );
  return NextResponse.json(
    {
      data: null,
      error: {
        code: "UNAVAILABLE",
        message: "This operation is temporarily unavailable. Please retry.",
      },
    },
    { status: 503 },
  );
}
