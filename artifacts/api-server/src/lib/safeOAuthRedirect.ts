/**
 * Safe post-OAuth redirects and HTML embedding helpers.
 * returnTo is attacker-controlled via /auth/google/start?returnTo=...
 * and is later embedded into a <script> tag after login.
 */

const MAX_RETURN_TO_LENGTH = 512;

/** Same-app relative paths only; reject protocol-relative and script/HTML breakouts. */
export function sanitizeReturnTo(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (value.length === 0 || value.length > MAX_RETURN_TO_LENGTH) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  // Disallow control chars, quotes, backticks, and angle brackets that enable
  // </script> breakout or attribute/script injection when embedded in HTML.
  if (/[\u0000-\u001f\u007f<>"'`]/.test(value) || value.includes("\\")) return "/";
  return value;
}

/** JSON.stringify for <script> embedding; escape <>& so </script> cannot break out. */
export function htmlSafeJson(value: string): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function oauthResultHtml(token: string, returnTo: string): string {
  const safeReturnTo = sanitizeReturnTo(returnTo);
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Loggar in...</title></head><body><script>localStorage.setItem("smakvarlden_token", ${htmlSafeJson(token)});window.location.replace(${htmlSafeJson(safeReturnTo)});<\/script></body></html>`;
}
