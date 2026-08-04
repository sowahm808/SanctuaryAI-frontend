# SanctuaryAI frontend

Production-oriented Angular 20 standalone frontend for **SanctuaryAI — From Divine Inspiration to Ministry Impact**.

## Run locally

```bash
npm install
npm start
npm test
npm run e2e
npm run build
```

The checked-in environment files contain safe public configuration and default to the same-origin `/api` proxy. Replace them at build/deploy time for another public API base URL; never place credentials, provider tokens, signing keys, or refresh tokens in an Angular environment file. OAuth credentials and refresh tokens must remain server-side.

For mobile builds, install the target package, run `npx cap add ios` or `npx cap add android`, build the web application, and then run `npx cap sync`. Configure platform deep links and backend OAuth redirect allow-lists for the application identifier before signing a release.

## Architecture

- `features/` owns lazy-loaded product workflows. Standalone pages keep feature boundaries explicit.
- `layout/` supplies the permission-aware responsive desktop/mobile shell.
- `services/` and `interceptors/` own session and transport concerns; UI components never call HTTP directly.
- `models/` contains strict domain contracts. Signals represent synchronous view state and RxJS/HttpClient is reserved for cancellable server workflows.
- IndexedDB preserves sermon and flyer drafts. The API remains authoritative after synchronization.

See [architecture and API notes](docs/ARCHITECTURE.md), the
[backend authentication integration guide](docs/BACKEND_AUTH_GUIDE.md), and
[backend delivery guide](docs/BACKEND_DELIVERY_GUIDE.md). The current gaps and
ordered follow-up work are recorded in the
[2026-08-04 delivery audit](docs/AUDIT_2026-08-04.md); see also the
[accessibility notes](docs/ACCESSIBILITY.md).
