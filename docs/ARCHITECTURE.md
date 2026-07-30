# Frontend architecture and API integration

Routes are lazy loaded under a guarded application shell. Authentication restoration happens before protected navigation. Granular permissions are represented as string-literal types and should be returned as organization-scoped claims by the backend.

API clients should return `ApiResponse<T>`, accept cursor pagination, and live in feature services. The interceptor attaches correlation IDs; production authentication should use an in-memory access token and a secure, SameSite refresh cookie. A refresh coordinator must serialize concurrent 401 retries. Never expose provider OAuth tokens to JavaScript.

Long-running generation and rendering operations should return job resources. Clients subscribe through polling or server events, show progress, permit cancellation, and retain the user's source draft. Server validation uses field-keyed problem details mapped onto typed reactive controls.

## Production

Run `npm run build`. Deploy the generated browser directory behind TLS with CSP, immutable hashed assets, SPA fallback routing, and backend proxy rules. For Capacitor, install the platform packages, add each target, build, and run `npx cap sync`.
