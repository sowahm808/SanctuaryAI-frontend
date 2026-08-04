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

## Monthly campaign builder backend contract

Implement the Phase 5 campaign APIs as authoritative, organization-scoped workflows. Campaign content is long-lived ministry content, so every mutation must use optimistic concurrency, permission checks, version metadata, lock enforcement, and immutable audit events.

### Campaign model and wizard drafts

`Campaign` records must include `id`, `organizationId`, `month`, `year`, `monthLabel`, `spiritualFocus`, `scriptures`, `sundays`, `events`, `tone`, `prayerQuantity`, `bibleTranslation`, `status`, `ownerId`, `createdAt`, `updatedAt`, `revision`, and `archivedAt`. Use typed child collections for:

- `sections`: theme, pastoral introduction, objectives, declaration, prayers, sermon series, flyer plan, social plan, video plan, and publishing calendar.
- `assignments`: section owner, reviewer, due date, status, and permission requirements.
- `versions`: section scope, revision, source job, actor, created time, change summary, and approval state.
- `locks`: section scope, lock reason, locked revision, actor, and timestamp.
- `auditEvents`: lifecycle action, safe change summary, actor, correlation ID, timestamp, and affected revision.

Support resumable wizard drafts with:

- `POST /campaigns/drafts` to create a campaign draft for a month/year with an idempotency key.
- `GET /campaigns/:id` to return the current campaign, wizard completion, sections, versions, locks, assignments, and audit summary.
- `PATCH /campaigns/:id/wizard` to save typed wizard input with `revision` and an idempotency key.
- `POST /campaigns/:id/duplicate` to clone an existing campaign into a new target month/year while preserving source attribution but not approvals or locks.
- `POST /campaigns/:id/archive` and `POST /campaigns/:id/restore` to manage archival with audit metadata.

### Campaign validation

Return `422` field validation for invalid calendar or ministry inputs. Required checks include:

- `month` is 1-12 and `year` is within the configured ministry planning range.
- Sundays belong to the selected month/year and use the organization's configured timezone.
- Event dates belong to the selected campaign window unless explicitly marked as a cross-month handoff.
- Scripture references parse into supported canonical book/chapter/verse ranges; unsupported free text must be returned as validation errors, not silently accepted.
- `prayerQuantity` is a positive integer within the organization's subscription and generation limits.
- `bibleTranslation` is either the organization default or a server-supported translation.
- A non-archived campaign cannot duplicate the same organization/month/year unless the endpoint is explicitly creating a separate revision branch.

### Campaign generation jobs

Generation must be observable async work:

- `POST /campaigns/:id/generate` creates a generate-all job.
- `POST /campaigns/:id/sections/:scope/generate` creates a per-section job.
- `GET /jobs/:id` returns progress, current section, safe retry status, cancellation support, and failure code.
- `POST /jobs/:id/cancel` cancels queued/running campaign generation when safe.
- `POST /campaigns/:id/sections/:scope/regenerate` requires an explicit regeneration scope and source revision.

Generated output must never overwrite approved or locked content. Store generated candidates as new versions with `candidate` status, source prompt metadata safe for audit, and compare-before-replace data so the frontend can show a diff before applying the candidate. Safe retry must use idempotency keys and the original source revision to avoid duplicate replacements.

### Campaign editing, review, approvals, locks, and audit

Implement section-level lifecycle endpoints:

- `PATCH /campaigns/:id/sections/:scope` saves manual edits or applies a selected generated candidate using optimistic concurrency.
- `GET /campaigns/:id/sections/:scope/versions` returns comparable versions.
- `POST /campaigns/:id/sections/:scope/submit-review` moves a draft or candidate into review.
- `POST /campaigns/:id/sections/:scope/approve` approves one section and creates an approved-section lock.
- `POST /campaigns/:id/sections/:scope/reject` or `request-changes` records reviewer feedback without deleting versions.
- `POST /campaigns/:id/sections/:scope/unlock` requires elevated permission, reason, and audit metadata.

The server must deny unauthorized edits to locked sections with `403` or stale-revision changes with `409`. It must record create, save, generate, regenerate, submit, approve, reject, unlock, duplicate, archive, restore, and publish-calendar lifecycle actions in immutable audit history.

### Campaign acceptance checks

1. A locked approved section cannot be edited, regenerated over, or replaced by a user without unlock permission.
2. Regeneration creates a candidate version and leaves the prior approved/current version intact until explicitly replaced.
3. Calendar validation rejects Sundays outside the selected month in the organization's timezone.
4. Duplicate campaigns preserve source attribution but start with fresh draft approvals, locks, and audit events.
5. Generate-all can partially fail and still return observable section-level job progress and retry guidance.
6. Every lifecycle mutation emits a correlation ID and an audit event with actor, organization, campaign, scope, revision, and safe summary.

## Theme generator backend contract

Implement the Phase 6 theme APIs as reusable, versioned content generation workflows. Theme generation may be launched from a campaign or as a standalone template-driven workflow, but server authorization, versioning, review, and approval rules must be identical in both paths.

### Theme input and output model

`ThemeGenerationInput` must include `date`, optional `campaignId`, `topic`, `scriptures`, `spiritualEmphasis`, `pastorNotes`, `previousTheme`, `events`, `tone`, `audience`, `bibleTranslation`, and `templateId`. Validate the date in the organization timezone, require at least one topic or spiritual emphasis, validate scripture references, and reject unsupported tone/audience/translation values.

`ThemeOutput` must include all frontend-rendered fields: `title`, `subtitle`, `scriptures`, `explanation`, `pastoralIntroduction`, `objectives`, `weeklyDirection`, `confession`, `declaration`, `hashtags`, `flyerHeadline`, and `designConcept`. Store structured values rather than a single markdown blob so downstream campaign, flyer, sermon, social, and video workflows can consume individual fields safely.

### Theme generation workflow

Provide these endpoints:

- `POST /themes` creates a draft theme or typed generation request.
- `GET /themes/:id` returns input, current output, approval state, comments, versions, locks, and audit summary.
- `PATCH /themes/:id/input` saves typed form input with optimistic concurrency.
- `POST /themes/:id/generate` queues initial generation.
- `POST /themes/:id/refine` queues a scoped refinement using one of `prophetic`, `pastoral`, `simplify`, `add-scriptures`, `shorten`, `expand`, or `alternative-generation`.
- `POST /themes/:id/generation-jobs/:jobId/cancel` cancels a queued or running generation job when safe, or use the shared job cancellation endpoint.
- `PATCH /themes/:id/output` applies reviewer/editor changes or selected generated candidates with compare-before-replace metadata.

Generation and refinement jobs must expose progress, cancellation/retry state, failure codes, source revision, and target fields. Refinements must produce candidate versions and must not overwrite approved content. `alternative-generation` should create a sibling candidate version that can be compared with the current version before replacement.

### Preview, comments, versions, approval, and templates

Support review and reuse with:

- `GET /themes/:id/preview` returning a frontend-safe projection of all required output fields and linked campaign context.
- `GET /themes/:id/versions` returning comparable versions with field-level change summaries.
- `POST /themes/:id/comments` and `PATCH /themes/:id/comments/:commentId` for reviewer comments, resolution state, and mentions.
- `POST /themes/:id/submit-review` to request approval.
- `POST /themes/:id/approve` to approve and lock the theme.
- `POST /themes/:id/request-changes` and `POST /themes/:id/reject` to preserve reviewer decisions and comments.
- `POST /themes/:id/templates` to save an approved or draft theme shape as a reusable template with organization ownership, safe prompt metadata, and audit history.

Approval must lock the approved theme revision from unauthorized edits. Template creation must preserve source theme/version IDs and never expose hidden prompt secrets or provider payloads.

### Theme acceptance checks

1. Every required output field can be generated, previewed, versioned, reviewed, and approved independently of a campaign.
2. Refinements create candidate versions and never overwrite approved content.
3. Cancellation and retry preserve the source revision and do not create duplicate current versions.
4. Reviewer comments and approval actions include actor, timestamp, correlation ID, and safe audit metadata.
5. Saving as a template preserves allowed structured fields and excludes provider secrets, raw tokens, and unsafe prompt internals.
6. Scripture, tone, audience, date, and event validation return field-addressable `422` errors that frontend forms can map directly.
