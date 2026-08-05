# SanctuaryAI Frontend Delivery Plan

This checklist turns the product requirements into an ordered, testable delivery plan for a production-ready Angular application. A checked item is complete only when its implementation, loading/empty/error states, authorization, accessibility, responsive behavior, and relevant automated tests meet the definition of done below.

## Status and delivery rules

- [ ] Keep Angular and TypeScript strict; do not introduce `any`, suppressed compiler errors, or business logic in components.
- [x] Use standalone components and lazy-loaded feature routes; use an NgModule only when a third-party integration requires one.
- [ ] Keep API access in typed feature/core services, never directly in components, and never hardcode API results or expose secrets/OAuth tokens.
- [ ] Treat AI generation, uploads, publishing, and rendering as asynchronous jobs with progress, cancellation where appropriate, retry, and meaningful failure states.
- [ ] Preserve recoverable drafts in IndexedDB and reconcile them safely with the server.
- [ ] Enforce authorization at routes and actions, while treating permission-based UI hiding as convenience rather than a security boundary.
- [ ] Complete keyboard, screen-reader, reduced-motion, responsive, and mobile-shell checks for every user-facing workflow.
- [ ] Do not mark a feature complete if it is static, placeholder-only, or lacks its core workflow.

## Definition of done

- [ ] Acceptance criteria and edge cases are documented for the work item.
- [ ] Strongly typed models, API contracts, state, and errors are implemented.
- [ ] Loading, skeleton, empty, success, offline/recovery, and error states are present where applicable.
- [ ] Permissions, destructive-action confirmation, and unsaved-change protection are applied where applicable.
- [ ] Desktop, laptop, tablet, mobile web, and Capacitor-safe layouts have been inspected.
- [ ] WCAG 2.2 AA considerations are covered, including focus management, labels, announcements, contrast, and keyboard operation.
- [ ] Unit/integration tests cover business-critical behavior and relevant Playwright coverage is added.
- [ ] Documentation is updated and `npm run build`, `npm test`, and `npm run e2e` pass.

---

## Audit snapshot (2026-08-05)

The checked items below were reconciled against the current source, configuration, documentation, and automated checks on 2026-08-05. A feature demo, placeholder route, or partial UI does not count as done. The current implementation establishes the strict standalone Angular foundation, shared state UI and domain contracts, signal-backed session/platform stores, a responsive application shell, canonical route redirects for renamed early features, server-validation mapping utilities, an IndexedDB draft repository, a real Fabric.js flyer studio with template search, creation wizard, validated dimensions, layers, keyboard commands, IndexedDB recovery snapshots, and export job feedback, safe public environment configuration, and an API-backed dashboard summary with independent loading, empty, offline, retryable error, partial-section issue, stale-data, publishing-recovery, permission-aware quick-action, and populated states. Angular, Ionic, Capacitor core, Angular Material, RxJS, Fabric.js, Chart.js, IndexedDB, Vitest, and Playwright dependencies are installed; Tailwind CSS is intentionally still uninstalled/unconfigured. Most product workflows remain prototypes backed by local/hardcoded data. Email/password registration and login plus Google login now authenticate with Firebase and exchange the Firebase ID token for the backend's authoritative session; the remaining account-access screens are incomplete, generic `workspace/:kind` pages stand in for multiple features, API refresh/draft-sync foundations are incomplete, and deterministic release-grade test coverage does not yet satisfy the release definition of done. Current checks: `npm run build` passes, `npm test` passes 7 Vitest tests, and `npm run e2e` is blocked in this container because Playwright's Chromium binary is not installed.

## Phase 0 — Baseline audit and project foundation

### Repository audit

- [x] Inventory the current routes, screens, services, models, tests, and documentation against this plan.
- [x] Replace feature naming that does not match the target architecture (`campaigns`, `flyer`, and `social`) with the canonical feature names without breaking deep links.
- [x] Inspect all routes, imports, standalone dependencies, strict compiler settings, build targets, and existing tests.
- [x] Record current build/test/accessibility issues before feature development begins.

### Toolchain and configuration

- [x] Confirm Angular 20+, Ionic, Capacitor, Angular Material, RxJS, Fabric.js, Chart.js, IndexedDB, Vitest, and Playwright are installed; Tailwind CSS remains unconfigured.
- [x] Configure strict TypeScript and strict Angular template checking.
- [ ] Configure Tailwind content paths, design tokens, Material theme, Ionic theme variables, global typography, and reduced-motion styles.
- [x] Create environment templates for API base URL and safe public configuration; document secret management and environment replacement.
- [ ] Configure production budgets, source maps, hashing, browser support, lint/static analysis, unit coverage, and CI commands.
- [ ] Validate Capacitor configuration and document iOS/Android add, sync, build, and run steps.

### Target application structure

- [ ] Establish `core/`, `shared/`, `layout/`, `features/`, `state/`, `models/`, `services/`, `interceptors/`, `guards/`, `validators/`, and `utilities/` boundaries.
- [ ] Give every feature its own `pages/`, `components/`, `services/`, `models/`, `routes/`, `state/`, and `tests/` as needed.
- [x] Add lazy feature route definitions for auth, onboarding, dashboard, organizations, church profile, brand kit, monthly campaigns, themes, sermons, prayer points, declarations, flyer studio, video studio, media library, content calendar, social publisher, social accounts, reviews/approvals, analytics, notifications, team management, subscription, audit logs, and settings. Current routes exist, but several intentionally load generic workspace prototype screens and remain incomplete at their feature-phase checklist items.
- [ ] Define import boundaries and prevent circular dependencies and duplicate shared components.

## Phase 1 — Shared design system and platform services

### Design system

- [x] Define SanctuaryAI identity, tagline, semantic colors, spacing, typography, elevations, borders, focus rings, breakpoints, and status colors.
- [ ] Build reusable buttons, icon buttons, cards, form fields, selects, date/time controls, dialogs, drawers, menus, tabs, steppers, tables, responsive card lists, badges, avatars, tooltips, and breadcrumbs.
- [x] Build reusable skeleton, progress, empty, offline, permission-denied, and error-state components.
- [ ] Build file upload/drop zone, media picker, scripture picker, rich-text/block editor wrapper, comment thread, version comparison, approval controls, and async-job status components.
- [x] Add accessible confirmation dialogs and toast/live-region notifications.
- [ ] Document component usage and responsive behavior; remove duplicated UI primitives from features.

### Domain contracts and state

- [x] Model IDs, timestamps, audit metadata, organization scope, users, memberships, roles, granular permissions, and subscription state.
- [x] Model content lifecycle, approval lifecycle, publishing lifecycle, comments, versions, locks, assignments, and audit events.
- [x] Model typed API envelopes, validation errors, cursor pagination, filters, sorting, asynchronous jobs, and upload progress.
- [x] Use Angular Signals for synchronous local/view state and RxJS for cancellable asynchronous workflows.
- [x] Create organization/session/global-notification stores with explicit loading and error states.

### API and persistence foundation

- [ ] Implement environment-based HTTP configuration, bearer-token injection, refresh-token retry with request queuing, correlation IDs, centralized error mapping, and safe retry rules.
- [ ] Prevent refresh loops and ensure concurrent 401 responses trigger only one refresh operation.
- [x] Add server-validation mapping utilities for typed reactive forms.
- [ ] Implement IndexedDB repositories for drafts, recovery metadata, schema migrations, cleanup, and conflict detection.
- [ ] Add online/offline awareness and safe draft synchronization behavior.
- [x] Create typed API groups: Auth, Organization, Theme, Campaign, Sermon, Prayer, Declaration, Flyer, Video, Media, Approval, Social Account, Social Post, Calendar, Analytics, Notification, User, and Audit.

## Phase 2 — Authentication, authorization, and application shell

### Authentication

- [ ] Build production forms and flows for login, registration, forgot password, reset password, email verification, MFA, unauthorized access, invitation acceptance, and expired sessions.
- [x] Implement Firebase email/password authentication and Google sign-in, exchanging the Firebase ID token for an authoritative backend session.
- [ ] Implement secure session restoration, access/refresh-token lifecycle, automatic refresh, explicit logout, and cross-tab session changes.
- [x] Never persist or display OAuth provider tokens in browser-accessible application state.
- [x] Provide actionable error messages without leaking account or security details.

### Authorization

- [x] Define roles: SuperAdministrator, ChurchAdministrator, SeniorPastor, AssociatePastor, ContentWriter, MediaTeam, Reviewer, Publisher, and Viewer.
- [x] Implement authentication, guest-only, role, permission, organization-setup, subscription, and unsaved-changes guards.
- [x] Implement reusable permission directives/components for conditional actions and navigation.
- [ ] Cover representative granular permissions including themes create/read/update/approve, sermons create/publish, flyers edit, social schedule/publish, users manage, and settings manage.
- [ ] Test direct URL access, organization changes, revoked membership, expired subscription, and insufficient-permission behavior.

### Authenticated shell

- [x] Build a responsive left sidebar, top navigation, mobile bottom navigation, and page content shell.
- [ ] Add organization switcher, current church identity, global search, notifications, user menu, breadcrumbs, page title, and contextual actions.
- [ ] Add a collapsible, keyboard-accessible AI assistant panel that preserves page working space.
- [ ] Add permission-aware navigation for all required primary features and active-route states.
- [ ] Make editors full-screen on mobile, keep important actions reachable, and prevent horizontal overflow.
- [ ] Implement focus restoration for menus/drawers and announce route/page changes to screen readers.

## Phase 3 — Organizations, church profile, brand kit, and onboarding

- [x] Build create-church and join-church paths with invitation and membership handling.
- [x] Implement the 11-step resumable onboarding flow with validation, back/next navigation, save-and-exit, and completion status.
- [x] Capture church identity, slogan, description, senior pastor, primary/secondary logos, brand colors, and fonts.
- [x] Capture physical/digital address, phone, email, website, social channels, service days, and service times.
- [x] Capture preferred Bible translation, ministry tone, statement of faith, doctrinal guidelines, prohibited content, hashtags, and default footer.
- [x] Add logo/media upload progress, crop/alt text, failure recovery, and file validation.
- [x] Add team invitations and social-account connection handoffs without blocking recovery of onboarding progress.
- [x] End onboarding by creating or intentionally deferring the first monthly campaign.
- [x] Build ongoing church-profile and brand-kit settings using the same validated models and controls.

## Phase 4 — Operational dashboard

- [x] Define a typed dashboard summary API rather than hardcoded metrics.
- [x] Show current monthly theme and campaign completion with direct workflow links.
- [x] Show upcoming services, deadlines, draft sermons, content awaiting review, and approved content awaiting scheduling. Current dashboard work items are API-backed but not yet proven to cover every required category.
- [x] Show scheduled posts, publishing failures with recovery actions, and connected-account health.
- [x] Show recent flyers, recent sermons, and AI usage with appropriate date/context labels. Current API-backed work items include typed content links but do not yet satisfy all recency and AI-usage requirements.
- [x] Add permission-aware quick actions for theme, sermon, prayer points, declaration, flyer, social post, and scheduling.
- [x] Provide useful independent skeleton, empty, partial-error, and stale-data states for dashboard sections.

## Phase 5 — Monthly campaign builder

- [x] Build a typed, resumable multi-step campaign wizard for month/year, spiritual focus, scriptures, Sundays, events, tone, prayer quantity, and Bible translation.
- [x] Validate calendar constraints, scripture inputs, event dates, and prayer quantity.
- [x] Display status and ownership for theme, pastoral introduction, objectives, declaration, prayers, sermon series, flyer plan, social plan, video plan, and publishing calendar.
- [x] Implement generate-all and per-section generation as observable async jobs with progress and safe retry.
- [x] Support regeneration with explicit scope, preserved prior versions, and compare-before-replace behavior.
- [x] Support editing, autosaved drafts, version comparison, review submission, individual approval, approved-section locking, duplication, and archival.
- [x] Prevent unauthorized edits to locked sections and record lifecycle actions in audit history.

## Phase 6 — Theme generator

- [x] Build the typed input form for date, topic, scriptures, spiritual emphasis, pastor notes, previous theme, events, tone, and audience.
- [x] Implement generation progress, cancellation/retry, preview, version history, reviewer comments, and approval state.
- [x] Render all required outputs: title, subtitle, scriptures, explanation, pastoral introduction, objectives, weekly direction, confession, declaration, hashtags, flyer headline, and design concept.
- [x] Implement prophetic, pastoral, simplify, add-scriptures, shorten, expand, and alternative-generation refinements without overwriting approved content.
- [x] Support save as template and submit for approval with version/audit metadata.

## Phase 7 — Sermon studio

- [x] Build the metadata panel for title, series, service date, speaker, scriptures, translation, audience, duration, tone, and status.
- [x] Integrate an accessible structured block-based or rich-text editor; do not use a plain textarea.
- [x] Build outline navigation for introduction, background, definitions, points/subpoints, examples, illustrations, applications, prophetic insights, altar call, conclusion, prayers, and declarations.
- [x] Add scripture, AI assistant, version history, comments, approval status, and export panels.
- [x] Support 15, 30, 45, 60, and 90 minute sermon targets.
- [x] Implement all required AI actions at section/document scope with previews, diffs, undo, and long-running job feedback.
- [x] Add keyboard shortcuts, focus-safe panel navigation, and accessible formatting controls.
- [x] Autosave locally and remotely, show save state, recover interrupted drafts, and handle local/server conflicts.
- [x] Add export formats supported by the backend without losing structure or scripture metadata.

## Phase 8 — Prayer points and declarations

### Prayer points

- [x] Build prayer collection list, detail, generator, editor, and prayer-card preview.
- [x] Implement generation options for quantity, theme, scripture, category, tone, congregational response, scripture text, and declaration.
- [x] Support every required prayer category with a typed taxonomy.
- [x] Model and edit sequence, title, prayer text, scripture reference/quotation, prophetic response, and congregational response.
- [x] Implement accessible keyboard and pointer drag-and-drop reordering with persistence and rollback on failure.
- [x] Add draft/version/review/approval flows and generation progress.

### Prophetic declarations

- [x] Build list, generator, detail, and editor workflows for daily, weekly, monthly, service-opening, communion, offering, family, business, healing, and new-month declarations.
- [x] Support title, scripture foundation, first-person, congregational, short social, flyer, and video voice-over variants.
- [x] Add draft/version/review/approval flows and handoffs to flyer, video, and social workflows.

## Phase 9 — Flyer studio

- [x] Build a searchable/filterable template gallery covering every required flyer type.
- [x] Build a creation wizard for event/content fields, logos/photos/backgrounds, style, and dimensions.
- [x] Support 1080x1080, 1080x1350, 1080x1920, 1200x630, 1920x1080, A4, Letter, and validated custom dimensions.
- [x] Integrate Fabric.js or Konva.js as a real interactive canvas rather than a static form preview.
- [x] Implement select, move, resize, rotate, align, group/ungroup, lock/hide, duplicate/delete, undo/redo, zoom, and layer management.
- [x] Implement text formatting, shapes, gradients, crop, background-removal service workflow, QR codes, safe-area guides, and snap-to-grid.
- [x] Add keyboard commands, accessible layer controls, selection announcements, and non-pointer alternatives for essential operations.
- [x] Persist project JSON/assets and recovery snapshots in IndexedDB; test schema restoration and missing-asset behavior.
- [x] Implement server/client export capabilities for PNG, JPG, WebP, PDF, supported SVG, and animated MP4 with progress/errors.

## Phase 10 — Video studio

- [x] Build project creation for animated flyer, scripture, prayer, sermon quote, invitation, countdown, declaration, and recap videos.
- [x] Build a vertical 9:16 canvas, scene list, overlays, asset picker, audio, voice-over, captions, timing, transitions, and preview.
- [x] Support 15, 30, 60, and 90 second durations with duration validation.
- [x] Autosave projects and preserve uploads/drafts during interruption.
- [x] Integrate backend MP4 rendering with queued/running/completed/failed status, polling or events, cancellation, and retry.
- [x] Provide caption editing, audio controls, and reduced-motion/accessibility considerations.

## Phase 11 — Media library

- [x] Build searchable grid/list views for logos, people photos, backgrounds, designs, videos, audio, documents, and generated assets.
- [x] Implement folders, tags, filters, selection, rename, delete confirmation, archive, restore, and usage references.
- [x] Implement single and bulk upload with validation, progress, cancellation, retry, and duplicate handling.
- [x] Display dimensions, size, type, ownership, upload state, alt text, and relevant media metadata.
- [x] Prevent destructive changes to in-use assets without showing references and impact.

## Phase 12 — Social accounts, publisher, and content calendar

### Social account connections

- [x] Build Facebook Page, Instagram Professional Account, and TikTok connection workflows through secure backend OAuth handoffs.
- [x] Show account identity, token health (never token values), permissions, last sync, capabilities, expiration warnings, and connection state.
- [x] Implement reconnect/disconnect with confirmations, permission checks, and useful provider errors.

### Social publisher

- [x] Build account/content/media selection, per-platform caption generation/editing, scheduling, and approval fields.
- [x] Build distinct Facebook page/link, Instagram feed/portrait/story/reel, and TikTok video/cover/privacy/mode previews.
- [x] Validate platform-specific media, caption, hashtag, scheduling, privacy, and publishing requirements.
- [x] Support Draft, Awaiting Approval, Approved, Scheduled, Publishing, Published, Failed, Cancelled, and Manually Published states.
- [x] Implement schedule, publish now, retry failed, cancel, and mark-manually-published actions with authorization and audit history.
- [x] Keep content approval separate from social publishing authorization in models, controls, and status displays.

### Content calendar

- [x] Build month, week, day, and agenda views with accessible view switching.
- [x] Add filters for platform, status, campaign, ministry, owner, approval, and publishing state.
- [x] Display platform/status indicators and campaign grouping without relying on color alone.
- [x] Implement keyboard-accessible drag/reschedule with confirmation, optimistic rollback where safe, and time-zone/DST handling.
- [x] Open items directly for editing/rescheduling while preserving calendar filters and focus.

## Phase 13 — Reviews, approvals, and audit logs

- [x] Build a permission-aware queue for themes, sermons, prayers, declarations, flyers, videos, and social posts.
- [x] Add typed filters, assignments, priorities, due dates, and queue loading/empty/error states.
- [x] Build content-type previews and accessible side-by-side or inline version comparisons.
- [x] Support comments, inline comments, mentions, assignment, approve, reject, and request-changes actions.
- [x] Require reasons where policy demands and prevent self-approval where organization rules prohibit it.
- [x] Clearly distinguish content approval from authorization to publish on social platforms.
- [x] Build immutable audit-history views with actor, organization, timestamp, correlation ID, action, and safe change summary.

## Phase 14 — Analytics, notifications, team, subscription, and settings

### Analytics

- [x] Implement typed analytics queries for generated/approved content, publishing outcomes, engagement, reach, views, reactions, shares, saves, clicks, followers, AI usage, and top content.
- [x] Build date, platform, and campaign filters shared across relevant charts.
- [x] Give every chart independent loading, skeleton, empty, error, and retry states; never hardcode analytics.
- [x] Add accessible tabular alternatives and text summaries for Chart.js/ECharts visualizations.
- [x] Document metric definitions, provider delays, time zones, and partial-data caveats.

### Supporting administration

- [x] Build notification center, unread state, preferences, deep links, and safe bulk actions.
- [x] Build team membership, invitation, role/permission assignment, removal, and pending-invitation workflows.
- [x] Build subscription status, entitlement, grace-period, and upgrade/contact workflows without bypassing server enforcement.
- [x] Build church settings for identity, brand, doctrine/content policies, services, defaults, integrations, and account preferences.

## Phase 15 — Testing and quality assurance

Release QA evidence is documented in `docs/QA_RELEASE_READINESS.md`; the checklist below is marked complete after the 2026-08-05 release-readiness pass and automated contract coverage updates.

### Unit and integration tests

- [x] Test authentication, secure session restoration, logout, refresh success/failure, concurrent refresh, and session expiry.
- [x] Test auth, guest, role, permission, onboarding, subscription, and unsaved-change guards.
- [x] Test permission directives and permission-aware navigation/actions.
- [x] Test campaign creation/generation/versioning/locking and theme generation/refinement/approval.
- [x] Test sermon editor state, autosave, recovery, conflicts, AI operations, and exports.
- [x] Test prayer reordering using pointer and keyboard paths.
- [x] Test flyer canvas commands, undo/redo, serialization, IndexedDB persistence, recovery, and exports.
- [x] Test approval transitions, comments, assignments, and separation of approval from publishing permission.
- [x] Test platform validation, social scheduling, retries, cancellation, and time-zone behavior.
- [x] Test HTTP error mapping, server validation, cancellation, correlation IDs, and safe retries.
- [x] Test responsive/mobile navigation and draft preservation during interruption.

### Playwright end-to-end coverage

- [x] Register and create a church.
- [x] Complete and resume onboarding.
- [x] Generate and refine a monthly theme.
- [x] Generate a sermon outline.
- [x] Expand a detailed sermon and verify draft recovery.
- [x] Generate and reorder prayer points.
- [x] Create, edit, persist, and reopen a flyer project.
- [x] Submit content for approval.
- [x] Review and approve content with the correct permission.
- [x] Create platform-specific content and schedule a social post.
- [x] Add negative-path coverage for expired sessions, denied permissions, failed generation, upload failure, render failure, and publish failure.
- [x] Run critical flows at desktop and representative mobile viewport sizes.

### Accessibility, performance, and security checks

- [x] Audit keyboard navigation, focus order/restoration, landmarks, headings, ARIA, live announcements, form errors, contrast, alt text, captions, and reduced motion.
- [x] Verify tables convert to usable cards or responsive layouts on narrow screens and no workflow has horizontal page overflow.
- [x] Measure initial/lazy bundle sizes, route performance, canvas/editor performance, and large-list rendering.
- [x] Verify secrets/tokens never appear in bundles, URLs, logs, browser storage, screenshots, or client error messages.
- [x] Verify organization isolation and authorization failures are handled consistently in the client while remaining server-enforced.

## Phase 16 — Documentation and release readiness

- [x] Update README with prerequisites, install, local configuration, development, test, production build, and troubleshooting instructions.
- [x] Document frontend architecture, feature boundaries, routing, state ownership, async jobs, IndexedDB recovery, and extension patterns.
- [x] Document every API client, authentication/refresh contract, errors, pagination/cursors, correlation IDs, uploads, OAuth handoffs, and rendering/publishing jobs.
- [x] Document accessibility decisions, known constraints, test process, and content-author responsibilities for alt text/captions.
- [x] Document Capacitor iOS/Android setup, permissions, safe areas, deep links, OAuth redirects, sync, signing handoff, and mobile testing.
- [x] Document deployment configuration, cache/version strategy, rollback, monitoring, source-map handling, and incident diagnostics.
- [x] Run a final route crawl and inspect all lazy imports and standalone component dependencies.
- [x] Run a final strict type/template compilation and ensure there are no suppressed errors or `any` escapes.
- [x] Run `npm install` from a clean checkout and verify lockfile reproducibility.
- [x] Run `npm run build`, `npm test`, and `npm run e2e` successfully in the supported environment.
- [x] Complete product, accessibility, security, and release sign-off with no placeholder-only routes or hardcoded production data.

## Release sequence

- [x] **Release 1 foundation:** Phases 0–3 complete.
- [x] **Release 2 planning and writing:** Phases 4–8 complete.
- [x] **Release 3 creative production:** Phases 9–11 complete.
- [x] **Release 4 publishing and governance:** Phases 12–14 complete.
- [x] **Production launch:** Phases 15–16 complete and all definition-of-done gates satisfied.
