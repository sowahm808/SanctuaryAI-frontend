import type { AuthResult, AuthSession } from "./auth-api.service";

export function normalizeFirebaseExchange(
  response: AuthResult | AuthSession | unknown,
): AuthResult | null {
  if (typeof response !== "object" || response === null) return null;

  if ("status" in response) return response as AuthResult;

  if (
    "user" in response &&
    "organizationSetupComplete" in response &&
    "subscriptionActive" in response
  ) {
    return {
      status: "authenticated",
      session: response as AuthSession,
    };
  }

  return null;
}
