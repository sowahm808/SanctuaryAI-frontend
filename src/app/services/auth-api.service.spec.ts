import { describe, expect, it } from "vitest";
import type { AuthResult, AuthSession } from "./auth-api.service";
import { normalizeFirebaseExchange } from "./auth-result";

describe("normalizeFirebaseExchange", () => {
  it("preserves an authentication result returned by the API", () => {
    const result: AuthResult = {
      status: "authenticated",
      session: session(),
    };

    expect(normalizeFirebaseExchange(result)).toBe(result);
  });

  it("supports API deployments that return the session directly", () => {
    const directSession = session();

    expect(normalizeFirebaseExchange(directSession)).toEqual({
      status: "authenticated",
      session: directSession,
    });
  });

  it("requests the cookie-backed session for acknowledgement-only responses", () => {
    expect(normalizeFirebaseExchange({ success: true })).toBeNull();
  });
});

function session(): AuthSession {
  return {
    user: {
      id: "user-1",
      name: "Pastor Test",
      email: "pastor@example.com",
      permissions: new Set(),
    },
    role: "SeniorPastor",
    organizationSetupComplete: true,
    subscriptionActive: true,
  };
}
