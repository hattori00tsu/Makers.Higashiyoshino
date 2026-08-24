/** セッション用 cookie があるか。PKCE の code-verifier は含めない。 */
export function hasSupabaseAuthCookie(cookies: { name: string }[]) {
  return cookies.some(
    (cookie) => cookie.name.includes("-auth-token") && !cookie.name.includes("code-verifier"),
  );
}

export function isPrefetchRequest(request: Request) {
  const headers = request.headers;
  return (
    headers.get("next-router-prefetch") === "1" ||
    headers.has("next-router-segment-prefetch") ||
    headers.get("purpose") === "prefetch"
  );
}
