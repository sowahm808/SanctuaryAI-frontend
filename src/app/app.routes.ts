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
          import("./features/workspace/workspace.page").then(
            (m) => m.WorkspacePage,
          ),
      },
      {
        path: "prayer-points",
        data: { kind: "prayer-points" },
        loadComponent: () =>
          import("./features/workspace/workspace.page").then(
            (m) => m.WorkspacePage,
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
          import("./features/flyer/flyer.page").then((m) => m.FlyerPage),
      },
      {
        path: "social-publisher",
        loadComponent: () =>
          import("./features/social/social.page").then((m) => m.SocialPage),
      },
      { path: "campaigns", pathMatch: "full", redirectTo: "monthly-campaigns" },
      { path: "social", pathMatch: "full", redirectTo: "social-publisher" },
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
      {
        path: "workspace/:kind",
        loadComponent: () =>
          import("./features/workspace/workspace.page").then(
            (m) => m.WorkspacePage,
          ),
      },
      { path: "", pathMatch: "full", redirectTo: "dashboard" },
    ],
  },
  { path: "", pathMatch: "full", redirectTo: "auth/login" },
  { path: "**", redirectTo: "auth/login" },
];
