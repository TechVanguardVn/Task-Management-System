const PUBLIC_PATHS = ["/login", "/register"] as const;

export function getSafeRedirectPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }

  const isPublicPath = PUBLIC_PATHS.some(
    (path) => value === path || value.startsWith(`${path}?`),
  );

  if (isPublicPath) {
    return null;
  }

  return value;
}
