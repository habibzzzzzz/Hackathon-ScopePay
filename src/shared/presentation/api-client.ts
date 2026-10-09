export async function post<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(30000),
    });
  } catch (error) {
    if (
      error instanceof Error &&
      ["TimeoutError", "AbortError"].includes(error.name)
    )
      throw new Error(
        "This request took too long. Check whether it completed before trying again.",
      );
    throw new Error("Could not connect. Check your connection and try again.");
  }
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error(
      "The server could not complete this request. Please retry.",
    );
  const result = (await response.json()) as {
    data: T;
    error: { message: string } | null;
  };
  if (!response.ok || result.error)
    throw new Error(
      result.error?.message ?? "This operation could not be completed.",
    );
  return result.data;
}
