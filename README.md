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

Configure backend endpoints outside source control using environment replacements in deployment. OAuth credentials and refresh tokens must remain server-side. Add Capacitor targets with `npx cap add ios` / `npx cap add android`, then build and run `npx cap sync`.

## Architecture

- `features/` owns lazy-loaded product workflows. Standalone pages keep feature boundaries explicit.
- `layout/` supplies the permission-aware responsive desktop/mobile shell.
- `services/` and `interceptors/` own session and transport concerns; UI components never call HTTP directly.
- `models/` contains strict domain contracts. Signals represent synchronous view state and RxJS/HttpClient is reserved for cancellable server workflows.
- IndexedDB preserves sermon and flyer drafts. The API remains authoritative after synchronization.

See [architecture and API notes](docs/ARCHITECTURE.md) and [accessibility notes](docs/ACCESSIBILITY.md).
