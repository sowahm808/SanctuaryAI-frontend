import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import {
  catchError,
  finalize,
  map,
  Observable,
  of,
  shareReplay,
  tap,
} from "rxjs";
import type { Permission } from "../models/domain.models";
import { AuthApiService, AuthSession } from "./auth-api.service";

@Injectable({ providedIn: "root" })
export class SessionService {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly current = signal<AuthSession | null>(null);
  private restoreRequest?: Observable<boolean>;
  readonly session = this.current.asReadonly();
  readonly user = computed(() => this.current()?.user ?? null);
  readonly authenticated = computed(() => this.current() !== null);
  readonly organizationReady = computed(
    () => this.current()?.organizationSetupComplete ?? false,
  );
  readonly subscriptionActive = computed(
    () => this.current()?.subscriptionActive ?? false,
  );

  restore(): Observable<boolean> {
    if (this.authenticated()) return of(true);
    this.restoreRequest ??= this.api.session().pipe(
      tap((session) => this.setSession(session)),
      map(() => true),
      catchError(() => {
        this.clear();
        return of(false);
      }),
      finalize(() => {
        this.restoreRequest = undefined;
      }),
      shareReplay(1),
    );
    return this.restoreRequest;
  }
  establish(session: AuthSession): void {
    this.setSession(session);
    this.broadcast("signed-in");
  }
  logout(expired = false): void {
    this.api
      .logout()
      .pipe(catchError(() => of(undefined)))
      .subscribe(() => {
        this.clear();
        this.broadcast("signed-out");
        void this.router.navigate([
          "/auth",
          expired ? "session-expired" : "login",
        ]);
      });
  }
  can(permission: Permission): boolean {
    return this.user()?.permissions.has(permission) ?? false;
  }
  hasRole(roles: readonly string[]): boolean {
    return roles.includes(this.current()?.role ?? "");
  }
  private setSession(session: AuthSession): void {
    this.current.set({
      ...session,
      user: { ...session.user, permissions: new Set(session.user.permissions) },
    });
  }
  private clear(): void {
    this.current.set(null);
  }
  private broadcast(type: "signed-in" | "signed-out"): void {
    localStorage.setItem(
      "sanctuary-session-event",
      JSON.stringify({ type, at: Date.now() }),
    );
  }
  constructor() {
    addEventListener("storage", (event) => {
      if (event.key !== "sanctuary-session-event" || !event.newValue) return;
      const message = JSON.parse(event.newValue) as { type: string };
      if (message.type === "signed-out") {
        this.clear();
        void this.router.navigateByUrl("/auth/session-expired");
      } else this.restore().subscribe();
    });
  }
}
