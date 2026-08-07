import { inject } from "@angular/core";
import { CanActivateFn, CanDeactivateFn, Router } from "@angular/router";
import { map } from "rxjs";
import type { Permission, Role } from "../models/domain.models";
import { SessionService } from "../services/session.service";

export const authGuard: CanActivateFn = (_, state) => {
  const session = inject(SessionService),
    router = inject(Router);
  return session.restore().pipe(
    map(
      (ok) =>
        ok ||
        router.createUrlTree(["/auth/login"], {
          queryParams: { returnTo: state.url },
        }),
    ),
  );
};
export const guestGuard: CanActivateFn = () => {
  const session = inject(SessionService),
    router = inject(Router);
  return session
    .restore()
    .pipe(map((ok) => !ok || router.createUrlTree(["/app/dashboard"])));
};
export const permissionGuard: CanActivateFn = (route) => {
  const session = inject(SessionService),
    router = inject(Router);
  const required =
    (route.data?.["permissions"] as readonly Permission[] | undefined) ?? [];
  return (
    required.every((permission) => session.can(permission)) ||
    router.createUrlTree(["/auth/unauthorized"])
  );
};
export const roleGuard: CanActivateFn = (route) => {
  const roles = (route.data?.["roles"] as readonly Role[] | undefined) ?? [];
  return (
    inject(SessionService).hasRole(roles) ||
    inject(Router).createUrlTree(["/auth/unauthorized"])
  );
};
export const onboardingGuard: CanActivateFn = () =>
  !inject(SessionService).organizationReady() ||
  inject(Router).createUrlTree(["/app/dashboard"]);
export const organizationSetupGuard: CanActivateFn = () =>
  inject(SessionService).organizationReady() ||
  inject(Router).createUrlTree(["/onboarding"]);
export const subscriptionGuard: CanActivateFn = () =>
  inject(SessionService).subscriptionActive() ||
  inject(Router).createUrlTree(["/app/subscription"]);
export interface DirtyAware {
  hasUnsavedChanges(): boolean;
}
export const unsavedChangesGuard: CanDeactivateFn<DirtyAware> = (component) =>
  !component.hasUnsavedChanges() || confirm("Discard your unsaved changes?");
