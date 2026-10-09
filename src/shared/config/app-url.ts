type Environment = Record<string, string | undefined>;

export function resolveAppUrl(values: Environment): string {
  const configured = values.NEXT_PUBLIC_APP_URL?.trim();
  const hostedDomain =
    values.VERCEL_ENV === "preview"
      ? values.VERCEL_URL
      : values.VERCEL_PROJECT_PRODUCTION_URL || values.VERCEL_URL;
  const isLocal = (url: URL) =>
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  let url: URL;
  try {
    url = new URL(
      configured ||
        (hostedDomain ? `https://${hostedDomain}` : "http://localhost:3000"),
    );
  } catch {
    throw new Error("NEXT_PUBLIC_APP_URL must be a complete HTTP(S) URL.");
  }
  if (values.VERCEL === "1" && isLocal(url) && hostedDomain)
    url = new URL(`https://${hostedDomain}`);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error(
      "NEXT_PUBLIC_APP_URL must contain only the application origin.",
    );
  if (
    values.NODE_ENV === "production" &&
    values.APP_MODE === "live" &&
    (isLocal(url) || url.protocol !== "https:")
  )
    throw new Error("Live production requires a public HTTPS application URL.");
  return url.origin;
}
