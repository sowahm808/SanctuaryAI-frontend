import { Routes } from "@angular/router";
import {
  authGuard,
  onboardingGuard,
  organizationSetupGuard,
  permissionGuard,
} from "./guards/auth.guard";
export const routes: Routes = [
  {
    path: "auth",
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  {
    path: "onboarding",
    canActivate: [authGuard, onboardingGuard],
    loadComponent: () =>
      import("./features/onboarding/onboarding.page").then(
        (m) => m.OnboardingPage,
      ),
  },
  {
    path: "app",
    canActivate: [authGuard, organizationSetupGuard],
    loadComponent: () =>
      import("./layout/app-shell.component").then((m) => m.AppShellComponent),
    children: [
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard.page").then(
            (m) => m.DashboardPage,
          ),
      },

      {
        path: "church-profile",
        canActivate: [permissionGuard],
        data: { permissions: ["settings.manage"] },
        loadComponent: () =>
          import("./features/onboarding/onboarding.page").then(
            (m) => m.OnboardingPage,
          ),
      },
      {
        path: "brand-kit",
        canActivate: [permissionGuard],
        data: { permissions: ["settings.manage"] },
        loadComponent: () =>
          import("./features/onboarding/onboarding.page").then(
            (m) => m.OnboardingPage,
          ),
      },
      {
        path: "monthly-campaigns",
        loadComponent: () =>
          import("./features/campaigns/campaign.page").then(
            (m) => m.CampaignPage,
          ),
      },
      {
        path: "themes",
        canActivate: [permissionGuard],
        data: { permissions: ["themes.read"], kind: "themes" },
        loadComponent: () =>
          import("./features/themes/theme.page").then((m) => m.ThemePage),
      },
      {
        path: "prayer-points",
        loadComponent: () =>
          import("./features/prayers/prayer.page").then(
            (m) => m.PrayerCollectionPage,
          ),
      },
      {
        path: "sermons",
        canActivate: [permissionGuard],
        data: { permissions: ["sermons.create"] },
        loadComponent: () =>
          import("./features/sermons/sermon.page").then((m) => m.SermonPage),
      },
      {
        path: "flyer-studio",
        canActivate: [permissionGuard],
        data: { permissions: ["flyers.edit"] },
        loadComponent: () =>
          import("./features/flyers/pages/flyer-studio.page").then(
            (m) => m.FlyerStudioPage,
          ),
      },
      {
        path: "social-publisher",
        loadComponent: () =>
          import("./features/social/social.page").then((m) => m.SocialPage),
      },

      {
        path: "declarations",
        loadComponent: () =>
          import("./features/declarations/prophetic-declaration.page").then(
            (m) => m.PropheticDeclarationPage,
          ),
      },
      {
        path: "video-studio",
        loadComponent: () =>
          import("./features/video-studio.page").then((m) => m.VideoStudioPage),
      },
      {
        path: "content-calendar",
        loadComponent: () =>
          import("./features/content-calendar.page").then(
            (m) => m.ContentCalendarPage,
          ),
      },
      {
        path: "media-library",
        loadComponent: () =>
          import("./features/media-library.page").then(
            (m) => m.MediaLibraryPage,
          ),
      },
      {
        path: "analytics",
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },
      {
        path: "team-management",
        canActivate: [permissionGuard],
        data: { permissions: ["users.manage"] },
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },
      {
        path: "social-accounts",
        loadComponent: () =>
          import("./features/social/social.page").then((m) => m.SocialPage),
      },
      {
        path: "notifications",
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },
      {
        path: "subscription",
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },
      {
        path: "audit-logs",
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },

      {
        path: "settings",
        canActivate: [permissionGuard],
        data: { permissions: ["settings.manage"] },
        loadComponent: () =>
          import("./features/analytics-admin.page").then(
            (m) => m.AnalyticsAdminPage,
          ),
      },
      { path: "campaigns", pathMatch: "full", redirectTo: "monthly-campaigns" },
      { path: "social", pathMatch: "full", redirectTo: "social-publisher" },
      { path: "team", pathMatch: "full", redirectTo: "team-management" },
      { path: "workspace/themes", pathMatch: "full", redirectTo: "themes" },
      {
        path: "workspace/prayer-points",
        pathMatch: "full",
        redirectTo: "prayer-points",
      },
      {
        path: "reviews",
        loadComponent: () =>
          import("./features/reviews/reviews.page").then((m) => m.ReviewsPage),
      },
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
    ],
  },
  { path: "", pathMatch: "full", redirectTo: "auth/login" },
  { path: "**", redirectTo: "auth/login" },
];
