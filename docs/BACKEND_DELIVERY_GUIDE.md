# Backend delivery guide

This guide defines the server work required by the API-backed frontend. The browser must never manufacture dashboard content, authorization, job completion, or provider health. All endpoints are relative to `/api/v1`, use the authenticated organization from the server session, and return `X-Correlation-ID` on success and failure.

## Dashboard summary contract

Implement `GET /dashboard/summary`. The endpoint should aggregate independently sourced sections without leaking another organization. A successful response is:

```json
{
  "data": {
    "generatedAt": "2026-08-04T12:00:00Z",
    "metrics": [
      {
        "kind": "review",
        "label": "Awaiting review",
        "value": 6,
        "context": "2 due today",
        "severity": "warning"
      }
    ],
    "currentCampaign": {
      "id": "cmp_123",
      "title": "Walking in Kingdom Authority",
      "monthLabel": "August 2026",
      "scriptureReference": "Luke 10:19",
      "approvedAssets": 8,
      "totalAssets": 12,
      "nextServiceAt": "2026-08-09T09:00:00Z",
      "reviewCount": 3
    },
    "workItems": [
      {
        "id": "ser_123",
        "title": "The Authority of the Believer",
        "type": "sermon",
        "status": "Draft",
        "detail": "Autosaved remotely",
        "href": "/app/sermons/ser_123",
        "updatedAt": "2026-08-04T11:52:00Z"
      }
    ],
    "channels": [
      {
        "id": "soc_123",
        "provider": "instagram",
        "displayName": "Grace Community Church",
        "status": "warning",
        "statusLabel": "Expires soon",
        "reconnectHref": "/app/social-accounts/soc_123/reconnect"
      }
    ]
  },
  "correlationId": "01J4..."
}
```

`metrics`, `workItems`, and `channels` must always be arrays. Omit `currentCampaign` when none is active. Counts must reflect permissions: either exclude resources the member cannot read or deny the entire request consistently. `href` is a server-selected internal application path, never an external URL. Clamp invalid negative counts server-side and return ISO-8601 UTC timestamps.

### Performance and partial failure

Target a 500 ms p95 response from a read model or bounded parallel queries. Do not turn a failed provider-health refresh into invented healthy data. Return the last observed channel state with its stored observation time in a future additive field, or omit that channel. Use `503` only when no useful authoritative summary can be produced. Support `ETag`/`If-None-Match`; invalidate the read model after approval, scheduling, publishing, campaign, and account-connection changes.

## Common error contract

Return RFC-style JSON problem details with stable codes:

```json
{
  "code": "dashboard_unavailable",
  "detail": "The dashboard is temporarily unavailable.",
  "correlationId": "01J4...",
  "validation": []
}
```

Use `401` for an unusable session, `403` for missing organization permission, `409` for revision conflicts, `422` for field validation, `429` for throttling, and `5xx` only for server failures. Do not return stack traces, SQL errors, provider tokens, or provider response bodies.

## Security requirements

- Resolve organization, membership, role, subscription, and permissions from the server session on every request; ignore organization IDs sent by the browser unless explicitly selecting among authorized memberships.
- Store social OAuth access and refresh tokens encrypted at rest. API responses expose health/capabilities only, never token values.
- Apply CSRF protection to cookie-authenticated mutations, validate `Origin`, and keep the session cookie `Secure`, `HttpOnly`, scoped to `/api`, and appropriately `SameSite`.
- Record the correlation ID, actor, organization, resource, outcome, and safe change summary for mutations. Never log credentials, content secrets, or tokens.

## Async jobs and drafts (next backend milestone)

Generation, rendering, publishing, uploads, and exports should create an `AsyncJob` with `queued`, `running`, `completed`, `failed`, or `cancelled` status and integer progress from 0–100. Provide idempotency keys on creation, `GET /jobs/:id`, and an authorized cancellation endpoint. Retain failure codes suitable for safe retry and preserve the submitted source revision.

Draft mutations must accept a server revision and idempotency key. On conflict return `409` with the current server revision and enough metadata for the client to present a choice; never silently apply last-write-wins. A successful save returns the new revision and authoritative update timestamp so IndexedDB recovery records can transition to `synced`.

## Backend acceptance checks

1. Two organizations with similarly named content never see each other's metrics, work, campaigns, or channels.
2. Revoking membership invalidates or changes the next summary request immediately.
3. Empty organizations receive empty arrays and no fabricated campaign.
4. Provider outages never expose tokens or falsely report an account as healthy.
5. Correlation IDs appear in response headers, bodies, structured logs, and audit events.
6. Contract tests validate every enum and optional field above, plus `401`, `403`, `429`, and `503` behavior.
