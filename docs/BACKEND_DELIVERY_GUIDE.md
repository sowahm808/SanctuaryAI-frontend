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

## Organization, profile, brand kit, and onboarding contract

Implement the Phase 3 endpoints below with the same authenticated session, organization scoping, correlation ID, validation, and audit requirements described above. The frontend submits the 11-step onboarding payload through `POST /organizations`; the server decides whether the request creates a new organization or accepts an invitation based on `setupMode`.

### Create or join organization

`POST /organizations` accepts:

- `setupMode`: `create` or `join`.
- `invitationCode`: required only when joining an existing church.
- Identity: `name`, `slogan`, `description`, and `seniorPastor`.
- Brand kit: `primaryColor`, `secondaryColor`, `headingFont`, `bodyFont`, `primaryLogo`, `secondaryLogo`, logo alt text, and crop/safe-area notes.
- Contact and presence: physical address, digital/livestream address, phone, email, website, social channels, service days, and service times.
- Ministry voice: preferred Bible translation, ministry tone, statement of faith, doctrinal guidelines, prohibited content, default hashtags, and default footer.
- Recovery-safe handoffs: team invitation rows, social connection notes, and `firstCampaignChoice` with `create` or `defer`.

The response returns the authoritative `ChurchProfile` plus active membership, role, permissions, subscription status, and onboarding status so the next session refresh immediately passes organization guards.

### Onboarding drafts and completion

Support resumable server drafts with these endpoints in addition to local browser recovery:

- `GET /organizations/onboarding-draft` returns the current member's latest draft, step index, validation status by step, and revision.
- `PUT /organizations/onboarding-draft` upserts the draft with an idempotency key and server revision; return `409` on stale revisions.
- `POST /organizations/onboarding/complete` validates every required field, creates or activates membership, queues non-blocking invitation/social handoff jobs, and marks onboarding `complete`.

Do not block completion because an invitation email provider, social OAuth handoff, or upload processor is unavailable. Persist those failures as retryable jobs and return safe user-facing recovery messages.

### Media upload requirements

Logo and media uploads must validate MIME type, extension, dimensions where applicable, and file size before storage. Supported logo types are PNG, JPEG, WebP, and SVG up to 5 MB. Uploads should return an `AsyncJob` or upload session with progress, failure code, retry capability, alt text, crop metadata, and the final media ID. Never trust client-provided filenames as storage paths.

### Settings reuse

Implement ongoing profile and brand-kit settings with the same schema and validators used by onboarding:

- `GET /organizations/current` returns the active church profile.
- `PATCH /organizations/current` updates identity, contact, doctrine, service, social, and brand fields with optimistic concurrency.
- `POST /organizations/current/invitations` queues team invitations with role validation.
- `POST /organizations/current/social-handoffs` creates backend OAuth handoff URLs without returning provider tokens.

### First campaign handoff

When `firstCampaignChoice` is `create`, return a next-action URL or create a draft monthly campaign linked to the new organization. When it is `defer`, record the explicit deferral with actor and timestamp for audit and dashboard context.

## Expanded operational dashboard contract

`GET /dashboard/summary` now includes these additive arrays and state fields. Existing clients must continue to receive `metrics`, `currentCampaign`, `workItems`, and `channels`.

- `stale` and optional `staleReason` indicate the server is returning an authoritative but older read model.
- `sectionIssues` reports partial failures for `workItems`, `publishing`, `channels`, `recentContent`, or `aiUsage` without failing the entire dashboard.
- `workItems` must cover upcoming services, deadlines, draft sermons, content awaiting review, and approved content awaiting scheduling using a `category` enum.
- `scheduledPosts` lists approved posts waiting for publication with provider and scheduled time.
- `publishingFailures` lists failed posts with safe recovery links.
- `recentContent` contains recent flyers and sermons with contextual labels and timestamps.
- `aiUsage` reports the current period, used generations, limit, reset timestamp, and context label.
- `quickActions` contains permission-keyed actions for theme, sermon, prayer points, declaration, flyer, social post, and scheduling; the API should omit actions the member can never use, and the UI still applies permission checks.

Dashboard acceptance checks must prove each required category can be represented independently, partial failures are shown without hiding healthy sections, stale read models are labeled, and publishing recovery links never point outside the application.
