# Backend authentication integration guide

This document records the frontend's current login and post-login behavior and
defines the backend contract required to support it. It is an implementation
guide for the API, not a proposal to put provider or session credentials in the
browser.

## Executive summary

The active email/password, registration, and Google flows authenticate with the
Firebase Web SDK first. The browser then sends the resulting Firebase ID token
to `POST /api/v1/auth/firebase`. The backend must verify that token with the
Firebase Admin SDK, reconcile the SanctuaryAI user and membership, create its
own cookie-backed session, and return the application session described below.
Firebase persistence is **not** the authorization mechanism for application API
requests.

After authentication, the frontend keeps the application session in memory.
Every page reload restores it through `GET /api/v1/auth/session`, and all API
requests include the backend cookie. No bearer token, refresh token, Firebase ID
token, role, permission, or organization identifier is read from browser
storage.

## Audited frontend flow

### Login and registration

1. Email/password login calls Firebase `signInWithEmailAndPassword`; Google
   login calls `signInWithPopup`; registration calls
   `createUserWithEmailAndPassword` and sets the Firebase display name.
2. The frontend forces a fresh Firebase ID token and posts
   `{ "idToken": "..." }` to `/api/v1/auth/firebase` with credentials enabled.
3. The frontend accepts any of these successful exchange response shapes while
   the backend is being aligned:
   - an `AuthResult`;
   - an `AuthSession` directly;
   - either of those wrapped in `{ "data": ..., "correlationId": "..." }`;
   - an acknowledgement-only body, provided the cookie has already been set. In
     this last case the frontend immediately calls `/auth/session`.
4. An authenticated result is held only in memory. The user is sent to the
   `returnTo` query parameter when present, otherwise `/app/dashboard`.
5. An `mfa_required` result sends the user to `/auth/mfa?challenge=...`.
   `POST /auth/mfa/verify` must then set/upgrade the cookie and return an
   `AuthSession` directly.
6. A `verification_required` result sends the user to `/auth/verify-email`.

Password-reset email delivery currently uses Firebase directly. The backend
password-forgot endpoint exists in the typed client but is not called by the
page. The token-based backend reset, email-verification, invitation acceptance,
MFA verification, and logout endpoints are called by the page. The typed
`/auth/login` and `/auth/register` methods are currently dormant because the
active flow exchanges Firebase tokens instead.

### Session restore and protected navigation

Protected routes call `GET /api/v1/auth/session`. A successful response restores
the in-memory session before navigation. Any error is treated as unauthenticated
and redirects to `/auth/login?returnTo=<requested URL>`; consequently this
endpoint must reserve non-2xx responses for a genuinely unusable session rather
than transient profile enrichment failures.

Permission guards compare the exact permission strings returned in
`session.user.permissions`. Role checks compare the exact role strings below.
The backend is authoritative: never accept an organization, role, or permission
claim supplied independently by the browser.

Logout posts an empty object to `/api/v1/auth/logout`, then clears the frontend
session even if the request fails and also signs out of Firebase. Logout should
therefore be idempotent.

## Canonical response contract

The preferred exchange response is an unwrapped `AuthResult`. Use one response
shape consistently once deployed:

```json
{
  "status": "authenticated",
  "session": {
    "user": {
      "id": "usr_123",
      "name": "Pastor Ada",
      "email": "ada@example.org",
      "avatarUrl": "https://example.org/avatar.png",
      "permissions": ["themes.read", "sermons.create"]
    },
    "role": "SeniorPastor",
    "organizationId": "org_123",
    "organizationName": "Grace Church",
    "organizationSetupComplete": true,
    "subscriptionActive": true
  }
}
```

`GET /auth/session` and `POST /auth/mfa/verify` should return the `session`
object itself. `/auth/session` may alternatively wrap it as
`{ "data": <session>, "correlationId": "..." }`; MFA verification may not.

For intermediate states, return:

```json
{ "status": "mfa_required", "challengeId": "mfa_opaque_single_use_value" }
```

or:

```json
{ "status": "verification_required" }
```

Contract rules:

- `status` is exactly `authenticated`, `mfa_required`, or
  `verification_required`.
- `session` is required when `status` is `authenticated` and omitted otherwise.
- `challengeId` is required for `mfa_required`; it must be opaque, short-lived,
  single-use, and bound server-side to the pending identity and login attempt.
- `permissions` must be a JSON array of unique strings. The frontend converts it
  to a JavaScript `Set`; do not serialize a set as `{}`.
- Always emit the boolean fields `organizationSetupComplete` and
  `subscriptionActive`. Missing values become false in frontend decisions and
  also prevent recognition of a direct-session exchange response.
- Omit absent optional fields rather than returning incompatible types. IDs and
  names are strings.

Allowed roles are:

```text
SuperAdministrator, ChurchAdministrator, SeniorPastor, AssociatePastor,
ContentWriter, MediaTeam, Reviewer, Publisher, Viewer
```

Allowed permissions are:

```text
themes.create, themes.read, themes.update, themes.approve,
sermons.create, sermons.publish, flyers.edit, social.schedule,
social.publish, users.manage, settings.manage
```

Unknown values currently provide no access. Coordinate additions with the
frontend's `Role` and `Permission` unions before returning them.

## Required endpoints

All paths below are relative to `/api/v1`. JSON requests use
`Content-Type: application/json` and all successful session-creating responses
set the application session cookie.

| Method | Path                       | Request                     | Success response | Notes                                                                                                                                                                         |
| ------ | -------------------------- | --------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST` | `/auth/firebase`           | `{ idToken }`               | `AuthResult`     | Verify token signature, issuer, audience, expiry, revocation policy, and intended Firebase project. Reconcile by verified Firebase UID; never trust request profile fields.   |
| `GET`  | `/auth/session`            | none                        | `AuthSession`    | `401` when no valid session exists. Re-read current membership/authorization or invalidate sessions when those facts change.                                                  |
| `POST` | `/auth/mfa/verify`         | `{ challengeId, code }`     | `AuthSession`    | Rate-limit attempts, consume the challenge, and establish the full session.                                                                                                   |
| `POST` | `/auth/invitations/accept` | `{ token, name, password }` | `AuthResult`     | Validate expiry, one-time use, intended email and organization; activation and token consumption should be atomic.                                                            |
| `POST` | `/auth/password/reset`     | `{ token, password }`       | empty `2xx`      | Enforce token expiry/single use and a minimum of 12 characters; revoke existing sessions after success. This is separate from the currently active Firebase reset-email flow. |
| `POST` | `/auth/email/verify`       | `{ token }`                 | empty `2xx`      | Validate and consume a one-time token. Coordinate this with Firebase email verification if Firebase is the source of truth.                                                   |
| `POST` | `/auth/logout`             | `{}`                        | empty `2xx`      | Revoke/delete the server session and expire the cookie using identical cookie attributes. Be idempotent.                                                                      |

`POST /auth/login`, `POST /auth/register`, and
`POST /auth/password/forgot` are represented in the frontend service but are not
used by the current UI. Do not make them the only supported path. They can be
deprecated after confirming no other client uses them, or retained with the
same throttling, enumeration resistance, and session contract.

## Cookie, proxy, and request requirements

- Use an opaque, high-entropy session identifier in a `Secure`, `HttpOnly`
  cookie. Never put Firebase tokens, provider tokens, roles, or permissions in a
  browser-readable cookie.
- The deployed browser calls same-origin `/api`; Netlify proxies it to the
  backend `/api/v1`. Development performs the same rewrite. The backend must not
  redirect these requests to its public origin, because that changes cookie and
  CORS behavior.
- Prefer a host-only cookie with `Path=/api` and `SameSite=Lax` for this
  same-site proxy design. If infrastructure requires `SameSite=None`, `Secure`
  is mandatory and explicit credentialed CORS plus CSRF protection are also
  required.
- State-changing cookie-authenticated endpoints need CSRF protection. At
  minimum validate `Origin`/`Referer` against an allow-list; a synchronizer or
  signed double-submit token is recommended if cross-site deployment is ever
  enabled.
- Set `Cache-Control: no-store` on token exchange, MFA, session, and logout
  responses. Do not log ID tokens, cookies, passwords, reset tokens, invitation
  tokens, or MFA codes.
- Honor or echo the frontend-generated `X-Correlation-ID`, and return it in an
  `X-Correlation-ID` header and error body. Generate a safe replacement when it
  is absent or malformed.
- Rotate the session identifier at authentication and privilege changes. Apply
  idle and absolute expiry, revoke sessions when membership is suspended, and
  cap active sessions according to product policy.

## Errors and status codes

Use a stable, non-secret problem body:

```json
{
  "code": "auth_invalid_credential",
  "detail": "The request could not be completed.",
  "correlationId": "01J...",
  "validation": [
    { "field": "code", "code": "invalid", "message": "Invalid code." }
  ]
}
```

- `400` for malformed/invalid input, `401` for absent, expired, or invalid
  authentication, `403` for authenticated-but-forbidden access, `409` for a
  consumed/conflicting invitation or state transition, and `429` for throttling.
- Return `Retry-After` with `429`. Rate-limit by a combination of account,
  challenge, session, and IP signals rather than IP alone.
- Do not reveal whether an email, invitation, or membership exists. Normalize
  timing and messages for password recovery and identity lookup paths.
- The login page only special-cases `0` and `429` HTTP statuses from backend
  exchange errors today; other backend details are deliberately replaced by a
  generic sign-in message. Codes are nevertheless useful for observability and
  future typed handling.

## Post-login organization and subscription behavior

The backend must compute `organizationSetupComplete` and `subscriptionActive`
from authoritative records on every session projection:

- Setup should only be complete after all backend-required onboarding state is
  committed. Do not accept the boolean from the client.
- Define subscription-active semantics explicitly (for example, whether trial
  and grace states count as active) and apply the same rule to API authorization.
- Scope every feature query and mutation to the session's active organization;
  never use an organization ID from a request without checking membership.
- Recompute or invalidate the session after invitation acceptance, onboarding
  completion, role changes, organization switching, subscription changes, or
  suspension.

### Audit finding: current routing does not enforce these booleans

The frontend defines organization-setup and subscription guards, but current
application routes do not attach them. Successful login also navigates directly
to `returnTo` or `/app/dashboard`, and the onboarding page currently advances
locally without persisting to an API. Therefore backend values must be correct
now, but changing only the backend will **not** redirect an incomplete
organization to onboarding or prevent navigation to subscription-gated pages.
The backend must independently reject unauthorized feature operations, and a
separate frontend change should wire the guards and onboarding persistence.

### Audit finding: refresh and automatic expiry handling are incomplete

The current frontend has no access-token refresh coordinator and no global 401
interceptor. It uses the cookie session until `/auth/session` restoration or an
individual request fails. The backend should initially use a renewable
cookie-backed server session if seamless activity extension is required. Do not
depend on a refresh-token response body or expect the browser to retry failed
requests. A future frontend change is required for global session-expired
navigation and serialized retry behavior.

### Audit finding: return destinations need frontend validation

The backend does not control `returnTo`. The frontend currently passes the
query value directly to Angular navigation. A follow-up frontend change should
allow only local, protected application URLs (for example `/app/...`) and should
select `/onboarding` or a subscription route from session state. Do not send
post-auth redirect URLs from the API until that policy exists.

## Backend implementation checklist

1. Configure Firebase Admin for project `sanctuaryai-b1012` and validate ID
   tokens server-side; use the verified UID as the immutable external identity.
2. Implement `/auth/firebase` and `/auth/session` first using the canonical
   schema and cookie rules above.
3. Reconcile users and memberships transactionally. Decide and test policy for
   first-time Google users, users without a membership, suspended memberships,
   duplicate verified emails, and multi-organization users.
4. Derive role, permissions, active organization, setup state, and subscription
   state on the server. Enforce them again on every protected API operation.
5. Implement idempotent logout and session revocation/rotation.
6. Either complete the MFA, invitation, backend reset, and backend verification
   endpoints to the exact contracts above or remove those frontend entry points
   in a coordinated release.
7. Add contract tests for every `AuthResult` branch, direct and wrapped session
   restoration, JSON permission arrays, expired cookies, revoked membership,
   MFA replay, rate limits, logout, and correlation IDs.
8. Run an end-to-end test through the real same-origin proxy. Confirm the
   browser stores the cookie, `/auth/session` survives a hard reload, protected
   API calls are organization-scoped, and logout expires the cookie.
