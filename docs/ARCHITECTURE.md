# Frontend architecture and API integration

Routes are lazy loaded under a guarded application shell. Authentication restoration happens before protected navigation. Granular permissions are represented as string-literal types and should be returned as organization-scoped claims by the backend.

API clients should return `ApiResponse<T>`, accept cursor pagination, and live in feature services. The interceptor attaches correlation IDs; production authentication should use an in-memory access token and a secure, SameSite refresh cookie. A refresh coordinator must serialize concurrent 401 retries. Never expose provider OAuth tokens to JavaScript.

Long-running generation and rendering operations should return job resources. Clients subscribe through polling or server events, show progress, permit cancellation, and retain the user's source draft. Server validation uses field-keyed problem details mapped onto typed reactive controls.

## Platform boundaries

- `core/api/ApiClientService` is the sole generic HTTP boundary for organization-scoped feature services. Its allow-listed API groups, cursor options, request and response types prevent arbitrary endpoints and untyped payloads from leaking into components.
- `core/api/mapApiError` converts HTTP failures into safe, actionable domain errors without exposing server internals. `core/forms/applyServerValidation` attaches typed field violations to reactive controls.
- `core/persistence/DraftRepository` stores organization-scoped recovery records in versioned IndexedDB stores. A draft records local/server revisions and an explicit synchronization state so a caller can detect conflicts instead of silently overwriting either version.
- Canonical product URLs use `/app/monthly-campaigns`, `/app/flyer-studio`, and `/app/social-publisher`; legacy campaign and social URLs redirect so bookmarks remain valid.

The API base URL is configured in `src/environments`. It is safe public configuration only: credentials, provider tokens, signing keys, and refresh tokens belong on the server. Deployments may replace the environment file or proxy `/api`; do not commit environment-specific secrets.

## Production

Run `npm run build`. Deploy the generated browser directory behind TLS with CSP, immutable hashed assets, SPA fallback routing, and backend proxy rules. For Capacitor, install the platform packages, add each target, build, and run `npx cap sync`.
