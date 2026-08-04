import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import type { Permission, Role, User } from "../models/domain.models";
import { environment } from "../../environments/environment";

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
  private readonly baseUrl = `${environment.apiBaseUrl}/auth`;
  session(): Observable<AuthSession> {
    return this.http
      .get<AuthSession | ApiEnvelope<AuthSession>>(`${this.baseUrl}/session`, {
        withCredentials: true,
      })
      .pipe(map(unwrapData));
  }
  login(body: Credentials): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/login`, body, {
      withCredentials: true,
    });
  }
  register(body: Registration): Observable<AuthResult> {
    return this.http.post<AuthResult>(`${this.baseUrl}/register`, body, {
      withCredentials: true,
    });
  }
  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/password/forgot`,
      { email },
      { withCredentials: true },
    );
  }
  resetPassword(token: string, password: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/password/reset`,
      { token, password },
      { withCredentials: true },
    );
  }
  verifyEmail(token: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/email/verify`,
      { token },
      { withCredentials: true },
    );
  }
  verifyMfa(challengeId: string, code: string): Observable<AuthSession> {
    return this.http.post<AuthSession>(
      `${this.baseUrl}/mfa/verify`,
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
      `${this.baseUrl}/invitations/accept`,
      { token, name, password },
      { withCredentials: true },
    );
  }
  logout(): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}/logout`,
      {},
      { withCredentials: true },
    );
  }
  exchangeFirebaseToken(idToken: string): Observable<AuthResult> {
    return this.http
      .post<AuthResult | ApiEnvelope<AuthResult>>(
        `${this.baseUrl}/firebase`,
        { idToken },
        { withCredentials: true },
      )
      .pipe(map(unwrapData));
  }
}

interface ApiEnvelope<T> {
  data: T;
  correlationId: string;
}

function unwrapData<T>(response: T | ApiEnvelope<T>): T {
  return typeof response === "object" && response !== null && "data" in response
    ? (response as ApiEnvelope<T>).data
    : (response as T);
}

export const EMPTY_PERMISSIONS: ReadonlySet<Permission> = new Set<Permission>();
