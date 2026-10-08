export async function post<T = unknown>(
  url: string,
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
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
