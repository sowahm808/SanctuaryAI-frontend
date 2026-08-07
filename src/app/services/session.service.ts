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
import { FirebaseAuthService } from "./firebase-auth.service";

@Injectable({ providedIn: "root" })
export class SessionService {
  private readonly api = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly current = signal<AuthSession | null>(null);
  private restoreRequest?: Observable<boolean>;
  private recoveryRequest?: Observable<boolean>;
  readonly session = this.current.asReadonly();
  readonly user = computed(() => this.current()?.user ?? null);
  readonly authenticated = computed(() => this.current() !== null);
  readonly organizationReady = computed(() => {
    const session = this.current();
    return (
      session?.organizationSetupComplete === true ||
      Boolean(session?.organizationId)
    );
  });
  readonly subscriptionActive = computed(
    () => this.current()?.subscriptionActive ?? false,
  );
  readonly profileName = computed(() => {
    const user = this.user();
    return user?.claims?.name || user?.name || user?.email || "Signed-in user";
  });
  readonly profileEmail = computed(
    () => this.user()?.claims?.email || this.user()?.email || "",
  );
  readonly profileAvatarUrl = computed(
    () => this.user()?.claims?.picture || this.user()?.avatarUrl,
  );
  readonly profileInitial = computed(
    () => this.profileName().trim().charAt(0).toUpperCase() || "?",
  );
  readonly organizationName = computed(
    () => this.current()?.organizationName || "Create church profile",
  );
  readonly organizationInitial = computed(
    () => this.organizationName().trim().charAt(0).toUpperCase() || "+",
  );

  restore(): Observable<boolean> {
    if (this.authenticated()) return of(true);
    this.restoreRequest ??= this.readSession().pipe(
      finalize(() => {
        this.restoreRequest = undefined;
      }),
      shareReplay(1),
    );
    return this.restoreRequest;
  }
  refresh(): Observable<boolean> {
    return this.readSession();
  }
  /** Serializes concurrent 401 recovery into one backend session check. */
  recoverExpiredSession(): Observable<boolean> {
    this.recoveryRequest ??= this.readSession().pipe(
      finalize(() => {
        this.recoveryRequest = undefined;
      }),
      shareReplay(1),
    );
    return this.recoveryRequest;
  }
  expire(): void {
    this.clear();
    this.broadcast("signed-out");
    void this.router.navigateByUrl("/auth/session-expired");
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
        void this.firebase.logout().catch(() => undefined);
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
  private readSession(): Observable<boolean> {
    return this.api.session().pipe(
      tap((session) => this.setSession(session)),
      map(() => true),
      catchError(() => {
        this.clear();
        return of(false);
      }),
    );
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
