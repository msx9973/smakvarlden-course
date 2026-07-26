import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PHONE_EMAIL_DOMAIN,
  assertSupabaseIdentityVerified,
  contactToStorageEmail,
  normalizeEmail,
  normalizePhone,
  shouldClaimUnverifiedPasswordAccount,
} from "./accountIdentity.ts";

describe("normalizeEmail", () => {
  it("accepts ordinary emails", () => {
    assert.equal(normalizeEmail("Victim@Gmail.com"), "victim@gmail.com");
  });

  it("rejects synthetic phone storage emails", () => {
    assert.equal(normalizeEmail(`phone.46701234567@${PHONE_EMAIL_DOMAIN}`), null);
  });
});

describe("contactToStorageEmail", () => {
  it("maps phone numbers to the synthetic storage domain", () => {
    assert.equal(
      contactToStorageEmail("+46701234567"),
      `phone.46701234567@${PHONE_EMAIL_DOMAIN}`,
    );
    assert.equal(
      contactToStorageEmail("0701234567"),
      `phone.46701234567@${PHONE_EMAIL_DOMAIN}`,
    );
  });

  it("does not allow pre-registering the synthetic phone email as an email", () => {
    assert.equal(
      contactToStorageEmail(`phone.46701234567@${PHONE_EMAIL_DOMAIN}`),
      null,
    );
  });
});

describe("normalizePhone", () => {
  it("accepts E.164 and common Swedish local forms", () => {
    assert.equal(normalizePhone("+46701234567"), "+46701234567");
    assert.equal(normalizePhone("070-123 45 67"), "+46701234567");
  });
});

describe("shouldClaimUnverifiedPasswordAccount", () => {
  it("claims only explicitly unverified password registrations", () => {
    assert.equal(shouldClaimUnverifiedPasswordAccount({ emailVerified: false }), true);
    assert.equal(shouldClaimUnverifiedPasswordAccount({ emailVerified: true }), false);
    assert.equal(shouldClaimUnverifiedPasswordAccount({}), false);
    assert.equal(shouldClaimUnverifiedPasswordAccount({ emailVerified: null }), false);
  });
});

describe("assertSupabaseIdentityVerified", () => {
  it("requires email_confirmed_at for email identities", () => {
    assert.throws(
      () => assertSupabaseIdentityVerified({ id: "1", email: "a@b.com" }),
      /verifierad/i,
    );
    assert.doesNotThrow(() =>
      assertSupabaseIdentityVerified({
        id: "1",
        email: "a@b.com",
        email_confirmed_at: "2026-01-01T00:00:00Z",
      }),
    );
  });

  it("requires phone_confirmed_at for phone identities", () => {
    assert.throws(
      () => assertSupabaseIdentityVerified({ id: "1", phone: "+46701234567" }),
      /verifierat/i,
    );
    assert.doesNotThrow(() =>
      assertSupabaseIdentityVerified({
        id: "1",
        phone: "+46701234567",
        phone_confirmed_at: "2026-01-01T00:00:00Z",
      }),
    );
  });
});
