# Theme generation 503 backend fix guide

## What the reported response means

The failing request is:

```http
POST /api/themes/1b8c4d56-839a-4fa6-aa04-2e6de041a3a7/generate
```

The server returned `503` with `code: "theme_generation_failed"` and correlation
ID `deabd2b9-dcc3-4a9d-9a87-843378a1c745`. The frontend is reaching the backend
successfully. A `503` generated after that point means the backend could not
start or complete its provider operation; it is not a browser routing or CORS
failure. Start the investigation by searching structured application, worker,
and gateway logs for that correlation ID.

Do not expose provider response bodies, API keys, prompts, or stack traces to the
browser. Retain the correlation ID in the safe public problem response and in
every internal log/event so the failure can be traced end to end.

## Expected API behavior

`POST /api/themes/:id/generate` should validate and authorize the request, create
a durable generation job, and return promptly. It should not keep the HTTP
request open while waiting for the AI provider.

Successful queueing should return `202 Accepted`:

```json
{
  "data": {
    "id": "job-uuid",
    "status": "queued",
    "progress": 0,
    "cancellationSupported": true
  }
}
```

The existing frontend then polls `GET /api/jobs/:jobId`. Provider errors that
happen after queueing belong on that job as `status: "failed"`; they should not
turn the initial generate request into a synchronous `503`.

Use the following public error mapping when a job cannot even be created:

| Condition                                     |  HTTP | Public code                    | Retryable           |
| --------------------------------------------- | ----: | ------------------------------ | ------------------- |
| Invalid theme input                           | `422` | `theme_validation_failed`      | No                  |
| Theme revision is stale                       | `409` | `theme_revision_conflict`      | After refresh       |
| Queue temporarily unavailable                 | `503` | `generation_queue_unavailable` | Yes                 |
| Provider authentication/configuration invalid | `503` | `ai_provider_misconfigured`    | No, operator action |
| Provider rate limit or temporary outage       | `503` | `ai_provider_unavailable`      | Yes                 |
| Provider timeout                              | `504` | `ai_provider_timeout`          | Yes                 |

The response content type should be `application/problem+json` and use the
frontend-compatible shape:

```json
{
  "code": "ai_provider_unavailable",
  "detail": "Theme generation is temporarily unavailable. Please retry shortly.",
  "correlationId": "request-correlation-id",
  "validation": []
}
```

## Immediate diagnosis checklist

1. Search all API and worker logs for
   `deabd2b9-dcc3-4a9d-9a87-843378a1c745`. Confirm whether the failure occurred
   before job creation, while publishing to the queue, or inside a worker.
2. Check the provider credential in the **deployed API/worker environment**, not
   only in a local shell. Verify that it is present, has no surrounding quotes or
   trailing newline, has not expired/revoked, and is available after the most
   recent deployment.
3. Verify the configured provider model is enabled for the account and region.
   Treat provider `400`/`404` model errors as configuration failures, not generic
   transient outages.
4. Inspect the provider's status and the backend's outbound DNS/TLS/network path.
   Record the provider HTTP status, request ID, error category, latency, attempt,
   model, and token limits in restricted structured logs.
5. Check queue connectivity, worker health, dead-letter depth, concurrency, and
   timeout settings. An API process that enqueues jobs and a worker that calls the
   provider must both receive the required configuration.
6. Confirm that the saved theme has valid input and that the requested `revision`
   still matches. Input or revision failures must be `422`/`409`, not `503`.

## Recommended implementation

### Request handler

Perform only server-owned validation and durable queueing in the request path:

```text
correlationId = acceptOrCreateCorrelationId(request)
authorize(user, organization, "themes.update")
theme = loadOrganizationTheme(params.id)
validate(theme.input, request.body.revision)

job = transaction:
  findOrCreateJob(idempotencyKey, theme.id, theme.revision)
  appendAuditEvent("theme.generation.queued", correlationId)
  enqueueAfterCommit(job.id, correlationId)

return 202 { data: publicJob(job) }
```

Accept an `Idempotency-Key` header (or derive a stable key from theme ID,
revision, operation, and a client request key). Repeating the same request must
return the existing job rather than generating and billing twice.

### Worker and provider adapter

The worker should:

1. Atomically claim the queued job and retain its theme source revision.
2. Mark it `running`, then call the provider through one adapter with explicit
   connect and overall timeouts.
3. Retry only transient failures (`408`, `429`, `5xx`, connection reset, or
   timeout) with exponential backoff and jitter. Honor `Retry-After`; cap attempts
   and total elapsed time. Never retry authentication, invalid-request, safety,
   or unsupported-model failures blindly.
4. Parse and schema-validate the structured theme result before persistence.
5. Store the result as a candidate version in a transaction. Never overwrite an
   approved or locked revision.
6. Mark exhausted failures with a safe code, retryability, attempt count, and
   correlation ID. Preserve the restricted provider request ID separately for
   operators.

Add a circuit breaker so a provider outage does not create an unbounded retry
storm. Keep queued work durable while the circuit is open, expose degraded health
to operators, and resume within controlled concurrency after recovery.

## Observability and security requirements

- Propagate `X-Correlation-ID` from the edge to the API, queue message, worker,
  provider adapter logs, job record, audit event, and response header. Generate a
  UUID when the incoming value is missing or invalid.
- Emit metrics for queue latency, provider latency, success/failure by safe error
  category, retry count, circuit state, and job age. Alert on sustained failure
  rate and oldest queued job, not on a single user retry.
- Redact credentials, authorization headers, full prompts, generated pastoral
  content, and raw provider errors. Log only allow-listed metadata.
- Add a startup/readiness check for required provider and queue configuration.
  Readiness may fail for configuration errors; a transient provider outage should
  instead report a degraded dependency without continually restarting healthy
  workers.

## Verification

Run these checks against a staging environment before deploying:

1. A valid request returns `202` with an `ApiResponse<AsyncJob>` envelope in less
   time than the provider generation takes.
2. `GET /api/jobs/:id` progresses from `queued` to `running` to `completed` and
   the theme result is stored as a candidate version.
3. A simulated provider `429`, `500`, and timeout retries within policy and ends
   in either `completed` or a retryable failed job with the same correlation ID.
4. A simulated invalid provider key fails without repeated calls, produces an
   operator-visible `ai_provider_misconfigured` category, and leaks no secret.
5. Repeating a generate request with the same idempotency key returns the same job
   and causes exactly one provider generation.
6. A locked/approved theme remains unchanged when generation succeeds or fails.
7. Invalid input returns field-addressable `422` validation issues, and a stale
   revision returns `409`.

Example contract smoke test (replace token and IDs for staging):

```bash
curl --fail-with-body -i \
  -X POST "$API_BASE/themes/$THEME_ID/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: theme-$THEME_ID-$REVISION" \
  -H "X-Correlation-ID: $(uuidgen)" \
  --data "{\"revision\":$REVISION}"
```

The production incident is fixed when this endpoint reliably queues a job, the
job exposes a diagnosable terminal state, and provider failures no longer depend
on a long-lived generate HTTP request.
