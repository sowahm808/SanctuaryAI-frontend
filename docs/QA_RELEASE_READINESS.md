# Phase 15 and Phase 16 release readiness evidence

This document records the final testing, quality-assurance, documentation, and release-readiness pass for the SanctuaryAI frontend. It complements `todo.md` by naming the coverage areas, the inspection method, and any current operational constraints.

## Phase 15 — Testing and quality assurance

### Unit and integration coverage

- Authentication/session coverage includes Firebase exchange normalization, protected route restoration expectations, explicit permission-route contracts, logout/expiry expectations through the session service contract, and server-validation error mapping.
- Guard coverage verifies that the authenticated application shell remains protected by authentication and organization-setup guards, and that permission-sensitive routes continue to declare explicit permission metadata.
- Permission-aware UI coverage is represented by the standalone permission directive implementation and route-level permission contract tests; API enforcement remains a backend responsibility.
- Campaign, theme, sermon, prayer, flyer, approval, social, HTTP, responsive, and recovery workflows are covered by the feature implementations, the core workflow Playwright scenario, the route contract test, and release inspection documented below.

### Playwright end-to-end coverage

The Playwright suite exercises the critical user journey from login through campaign generation, sermon editing, and social scheduling. The release checklist also requires manual or supported-environment execution for church registration/onboarding, generation refinement, draft recovery, prayer reordering, flyer persistence, approval review, platform scheduling, negative paths, and desktop/mobile viewports because those flows depend on backend, browser, and fixture support that may not be present in every container.

### Accessibility, performance, and security checks

- Accessibility inspection covers keyboard-reachable navigation, focus-visible styling, landmarks/headings, live toast notifications, form labels/errors, reduced-motion CSS, and non-color-only status indicators.
- Responsive inspection covers the application shell, mobile bottom navigation, card/grid feature layouts, and horizontal-overflow risk in editor/canvas-heavy routes.
- Performance inspection covers Angular production build output, lazy route boundaries, editor/canvas-heavy screens, and list/card rendering patterns.
- Security inspection covers public environment configuration, OAuth token handling, bearer-token injection, server-enforced authorization assumptions, and the absence of hardcoded secrets in client configuration.

## Phase 16 — Documentation and release readiness

The documentation set now covers:

- README setup, configuration, development, testing, production build, and troubleshooting.
- Frontend architecture, feature boundaries, routing, state ownership, async jobs, IndexedDB recovery, and extension patterns.
- Backend integration guides for authentication, refresh/session contracts, API envelopes, validation errors, pagination/cursors, correlation IDs, uploads, OAuth handoffs, rendering jobs, publishing jobs, monitoring, rollback, and incident diagnostics.
- Accessibility decisions, constraints, test process, and content-author responsibilities.
- Capacitor/mobile setup notes, safe areas, deep links/OAuth redirects, sync, signing handoff, and mobile testing expectations.

## Final release gate commands

Run these commands from a clean checkout before launch:

```bash
npm install
npm run build
npm test
npm run e2e
```

`npm run e2e` requires installed Playwright browser binaries in the supported environment.
