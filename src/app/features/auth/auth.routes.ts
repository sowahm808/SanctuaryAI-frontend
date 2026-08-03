import { Routes } from "@angular/router";
import { LoginPage } from "./login.page";
const modes = [
  "login",
  "register",
  "forgot-password",
  "reset-password",
  "verify-email",
  "mfa",
  "accept-invitation",
  "unauthorized",
  "session-expired",
];
export const AUTH_ROUTES: Routes = [
  ...modes.map((path) => ({ path, component: LoginPage })),
  { path: "", pathMatch: "full" as const, redirectTo: "login" },
  { path: "**", redirectTo: "login" },
];
