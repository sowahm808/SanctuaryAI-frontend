import { Routes } from "@angular/router";
import { authGuard, guestGuard } from "./guards/auth.guard";
export const routes: Routes = [
  {
    path: "auth",
    canActivate: [guestGuard],
    loadChildren: () =>
      import("./features/auth/auth.routes").then((m) => m.AUTH_ROUTES),
  },
  {
    path: "onboarding",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/onboarding/onboarding.page").then(
        (m) => m.OnboardingPage,
      ),
  },
  {
    path: "app",
    canActivate: [authGuard],
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
        path: "campaigns",
        loadComponent: () =>
          import("./features/campaigns/campaign.page").then(
            (m) => m.CampaignPage,
          ),
      },
      {
        path: "sermons",
        loadComponent: () =>
          import("./features/sermons/sermon.page").then((m) => m.SermonPage),
      },
      {
        path: "flyer-studio",
        loadComponent: () =>
          import("./features/flyer/flyer.page").then((m) => m.FlyerPage),
      },
      {
        path: "social",
        loadComponent: () =>
          import("./features/social/social.page").then((m) => m.SocialPage),
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
