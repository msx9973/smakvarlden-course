import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { htmlSafeJson, oauthResultHtml, sanitizeReturnTo } from "./safeOAuthRedirect.ts";

describe("sanitizeReturnTo", () => {
  it("allows ordinary same-app paths", () => {
    assert.equal(sanitizeReturnTo("/"), "/");
    assert.equal(sanitizeReturnTo("/recipes"), "/recipes");
    assert.equal(sanitizeReturnTo("/recipes/12?tab=cost"), "/recipes/12?tab=cost");
  });

  it("rejects protocol-relative and non-relative values", () => {
    assert.equal(sanitizeReturnTo("//evil.example"), "/");
    assert.equal(sanitizeReturnTo("https://evil.example"), "/");
    assert.equal(sanitizeReturnTo("recipes"), "/");
    assert.equal(sanitizeReturnTo(""), "/");
    assert.equal(sanitizeReturnTo(null), "/");
  });

  it("rejects script and HTML breakout payloads", () => {
    assert.equal(sanitizeReturnTo("/</script><script>alert(1)</script>"), "/");
    assert.equal(sanitizeReturnTo('/"onclick=alert(1)'), "/");
    assert.equal(sanitizeReturnTo("/`+alert(1)+`"), "/");
    assert.equal(sanitizeReturnTo("/foo\\bar"), "/");
    assert.equal(sanitizeReturnTo("/foo\nbar"), "/");
  });
});

describe("oauthResultHtml", () => {
  it("does not emit a raw </script> sequence for malicious returnTo", () => {
    const html = oauthResultHtml("jwt.token.value", "/</script><script>alert(1)</script>");
    assert.equal(html.includes("</script><script>"), false);
    assert.match(html, /window\.location\.replace\("\/"\)/);
  });

  it("HTML-escapes angle brackets inside embedded JSON", () => {
    const embedded = htmlSafeJson("</script><script>theft()</script>");
    assert.equal(embedded.includes("<"), false);
    assert.equal(embedded.includes(">"), false);
    assert.match(embedded, /\\u003c/);
  });

  it("keeps a safe returnTo usable after login", () => {
    const html = oauthResultHtml("jwt.token.value", "/dashboard");
    assert.match(html, /window\.location\.replace\("\/dashboard"\)/);
    assert.match(html, /localStorage\.setItem\("smakvarlden_token", "jwt\.token\.value"\)/);
  });
});
