import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable } from "rxjs";
import type { Permission, Role, User } from "../models/domain.models";

export interface AuthSession {
  user: User;
  role: Role;
  organizationId?: string;
  organizationName?: string;
  organizationSetupComplete: boolean;
  subscriptionActive: boolean;
}
export interface AuthResult {
  status: "authenticated" | "mfa_required" | "verification_required";
  session?: AuthSession;
  challengeId?: string;
}
export interface Credentials {
  email: string;
  password: string;
}
export interface Registration extends Credentials {
  name: string;
}

/** Cookie-based auth client. Provider and refresh tokens never enter application state. */
@Injectable({ providedIn: "root" })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  session(): Observable<AuthSession> {
    return this.http.get<AuthSession>("/api/auth/session", {
      withCredentials: true,
    });
  }
  login(body: Credentials): Observable<AuthResult> {
    return this.http.post<AuthResult>("/api/auth/login", body, {
      withCredentials: true,
    });
  }
  register(body: Registration): Observable<AuthResult> {
    return this.http.post<AuthResult>("/api/auth/register", body, {
      withCredentials: true,
    });
  }
  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(
      "/api/auth/password/forgot",
      { email },
      { withCredentials: true },
    );
  }
  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(
      "/api/auth/password/reset",
      { token, password },
      { withCredentials: true },
    );
  }
  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(
      "/api/auth/email/verify",
      { token },
      { withCredentials: true },
    );
  }
  verifyMfa(challengeId: string, code: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(
      "/api/auth/mfa/verify",
      { challengeId, code },
      { withCredentials: true },
    );
  }
  acceptInvitation(
    token: string,
    name: string,
    password: string,
  ): Observable<AuthResult> {
    return this.http.post<AuthResult>(
      "/api/auth/invitations/accept",
      { token, name, password },
      { withCredentials: true },
    );
  }
  logout(): Observable<void> {
    return this.http.post<void>(
      "/api/auth/logout",
      {},
      { withCredentials: true },
    );
  }
  providerUrl(provider: "google" | "microsoft", returnTo: string): string {
    return `/api/auth/oauth/${provider}/start?returnTo=${encodeURIComponent(returnTo)}`;
  }
}

export const EMPTY_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>();
