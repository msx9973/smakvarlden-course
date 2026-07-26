export const PHONE_EMAIL_DOMAIN = "phone.smakvarlden.local";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Normalize a user-supplied email. Rejects the synthetic phone storage domain so
 * callers cannot pre-register `phone.<digits>@phone.smakvarlden.local` and later
 * hijack a real phone login that maps to the same storage key.
 */
export function normalizeEmail(value: string): string | null {
  const email = value.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return null;
  if (email.endsWith(`@${PHONE_EMAIL_DOMAIN}`)) return null;
  return email;
}

export function normalizePhone(value: string): string | null {
  const compact = value.trim().replace(/[()\s-]/g, "");
  const withPlus = compact.startsWith("00")
    ? `+${compact.slice(2)}`
    : compact.startsWith("0")
      ? `+46${compact.slice(1)}`
      : compact;
  return /^\+[1-9]\d{7,14}$/.test(withPlus) ? withPlus : null;
}

export function contactToStorageEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = normalizeEmail(value);
  if (email) return email;
  const phone = normalizePhone(value);
  if (phone) return `phone.${phone.slice(1)}@${PHONE_EMAIL_DOMAIN}`;
  return null;
}

/**
 * Password registration does not prove inbox/phone ownership. When a later
 * federated login proves ownership of that contact, the unverified password
 * registration must be claimed (password rotated) so the attacker cannot retain
 * access after the real owner signs in.
 */
export function shouldClaimUnverifiedPasswordAccount(user: {
  emailVerified?: boolean | null;
}): boolean {
  return user.emailVerified === false;
}

export type SupabaseIdentity = {
  id: string;
  email?: string | null;
  phone?: string | null;
  email_confirmed_at?: string | null;
  phone_confirmed_at?: string | null;
};

/**
 * Require Supabase to have confirmed the contact we will key the local user on.
 * Prevents linking/creating accounts from unconfirmed Supabase identities when
 * the project still issues access tokens before confirmation.
 */
export function assertSupabaseIdentityVerified(profile: SupabaseIdentity): void {
  if (profile.email) {
    if (!profile.email_confirmed_at) {
      throw new Error("E-postadressen är inte verifierad.");
    }
    return;
  }
  if (profile.phone) {
    if (!profile.phone_confirmed_at) {
      throw new Error("Telefonnumret är inte verifierat.");
    }
    return;
  }
}
