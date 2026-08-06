import { Component, computed, inject, input, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  EMPTY,
  Observable,
  catchError,
  finalize,
  from,
  switchMap,
  tap,
} from "rxjs";
import { AuthApiService, AuthResult } from "../../services/auth-api.service";
import { SessionService } from "../../services/session.service";
import { FirebaseAuthService } from "../../services/firebase-auth.service";

type AuthMode =
  | "login"
  | "register"
  | "forgot-password"
  | "reset-password"
  | "verify-email"
  | "mfa"
  | "accept-invitation"
  | "unauthorized"
  | "session-expired";
const COPY: Record<AuthMode, { title: string; description: string }> = {
  login: {
    title: "Welcome back",
    description: "Sign in to your ministry workspace.",
  },
  register: {
    title: "Create your account",
    description: "Join your church team with your work email.",
  },
  "forgot-password": {
    title: "Reset your password",
    description: "We’ll send instructions if an account is eligible.",
  },
  "reset-password": {
    title: "Choose a new password",
    description: "Use at least 12 characters.",
  },
  "verify-email": {
    title: "Verify your email",
    description: "Confirm the address associated with your invitation.",
  },
  mfa: {
    title: "Security check",
    description: "Enter the six-digit code from your authenticator.",
  },
  "accept-invitation": {
    title: "Accept your invitation",
    description: "Finish setting up your ministry account.",
  },
  unauthorized: {
    title: "You don’t have access",
    description: "Ask a church administrator for the permission you need.",
  },
  "session-expired": {
    title: "Your session expired",
    description:
      "Sign in again to continue securely. Your saved drafts are unaffected.",
  },
};
@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: [
    `
      :host {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(320px, 1fr) minmax(360px, 1fr);
      }
      .brand {
        background: linear-gradient(145deg, #21163e, #3a2671);
        color: #fff;
        padding: clamp(2rem, 7vw, 7rem);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .quote {
        color: #fff;
        font-size: clamp(2rem, 4vw, 4.2rem);
        line-height: 1.04;
      }
      .auth {
        display: grid;
        place-items: center;
        padding: 2rem;
      }
      .panel {
        width: min(440px, 100%);
      }
      .logo {
        font-size: 1.4rem;
        font-weight: 800;
      }
      .form {
        display: grid;
        gap: 1rem;
      }
      .social {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.7rem;
      }
      .error-box,
      .success {
        padding: 0.8rem;
        border-radius: 10px;
        font-size: 0.86rem;
      }
      .error-box {
        color: var(--danger);
        background: #fef3f2;
      }
      .success {
        color: var(--green);
        background: #eef8f4;
      }
      .links {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        font-size: 0.84rem;
      }
      .links a {
        color: var(--violet);
      }
      @media (max-width: 760px) {
        :host {
          grid-template-columns: 1fr;
        }
        .brand {
          display: none;
        }
        .auth {
          padding: 1.25rem;
        }
      }
    `,
  ],
  template: `<section class="brand">
      <div class="logo">✦ SanctuaryAI</div>
      <!-- use the inverse logo -->

      <img src="/inverselogo.png" alt="SanctuaryAI Logo" width="400" height="400" />
      <div>
        <p class="eyebrow" style="color:#c8bafd">
          Ministry content operating system
        </p>
        <h1 class="quote">From Divine Inspiration to Ministry Impact.</h1>
        <p style="color:#d8d0ee">
          Plan, create, approve and publish scripture-centered content with your
          whole ministry team.
        </p>
      </div>
      <small>Secure • collaborative • church-centered</small>
    </section>
    <main class="auth">
      <div class="panel">
        <p class="eyebrow">Secure access</p>
        <h1>{{ copy().title }}</h1>
        <p class="muted">{{ copy().description }}</p>
        @if (error()) {
          <div class="error-box" role="alert">{{ error() }}</div>
        }
        @if (success()) {
          <div class="success" role="status">{{ success() }}</div>
        }
        @if (modeValue() === "unauthorized") {
          <a class="btn" routerLink="/app/dashboard">Return to dashboard</a>
        } @else {
          <form class="form" [formGroup]="form" (ngSubmit)="submit()">
            @if (
              modeValue() === "register" || modeValue() === "accept-invitation"
            ) {
              <div class="field">
                <label for="name">Full name</label
                ><input id="name" autocomplete="name" formControlName="name" />
              </div>
            }
            @if (needsEmail()) {
              <div class="field">
                <label for="email">Email address</label
                ><input
                  id="email"
                  type="email"
                  autocomplete="email"
                  formControlName="email"
                />
                @if (
                  form.controls.email.touched && form.controls.email.invalid
                ) {
                  <span class="error">Enter a valid email address.</span>
                }
              </div>
            }
            @if (needsPassword()) {
              <div class="field">
                <label for="password">Password</label
                ><input
                  id="password"
                  type="password"
                  [attr.autocomplete]="
                    modeValue() === 'login'
                      ? 'current-password'
                      : 'new-password'
                  "
                  formControlName="password"
                /><span class="hint">{{
                  modeValue() === "login"
                    ? "Enter your password."
                    : "At least 12 characters."
                }}</span>
              </div>
            }
            @if (modeValue() === "mfa") {
              <div class="field">
                <label for="code">Authentication code</label
                ><input
                  id="code"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  formControlName="code"
                />
              </div>
            }
            <button class="btn" [disabled]="loading() || !validForMode()">
              {{ loading() ? "Please wait…" : actionLabel() }}
            </button>
            @if (modeValue() === "login") {
              <div class="social">
                <button
                  type="button"
                  class="btn secondary"
                  [disabled]="loading()"
                  (click)="google()"
                >
                  Continue with Google
                </button>
              </div>
              <div class="links">
                <a routerLink="/auth/forgot-password">Forgot password?</a
                ><a routerLink="/auth/register">Create account</a>
              </div>
            }
          </form>
        }
        @if (modeValue() !== "login" && modeValue() !== "unauthorized") {
          <p style="margin-top:1rem">
            <a routerLink="/auth/login">Back to sign in</a>
          </p>
        }
      </div>
    </main>`,
})
export class LoginPage {
  readonly mode = input("login");
  private readonly api = inject(AuthApiService);
  private readonly session = inject(SessionService);
  private readonly firebase = inject(FirebaseAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly error = signal("");
  readonly success = signal("");
  readonly challengeId = signal("");
  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12)],
    }),
    code: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^\d{6}$/)],
    }),
  });
  readonly modeValue = computed(
    () => (this.mode() in COPY ? this.mode() : "login") as AuthMode,
  );
  readonly copy = computed(() => COPY[this.modeValue()]);
  readonly needsEmail = computed(() =>
    ["login", "register", "forgot-password"].includes(this.modeValue()),
  );
  readonly needsPassword = computed(() =>
    ["login", "register", "reset-password", "accept-invitation"].includes(
      this.modeValue(),
    ),
  );
  readonly actionLabel = computed(
    () =>
      ({
        login: "Sign in securely",
        register: "Create account",
        "forgot-password": "Send reset instructions",
        "reset-password": "Update password",
        "verify-email": "Verify email",
        mfa: "Verify code",
        "accept-invitation": "Join church",
        "session-expired": "Sign in securely",
        unauthorized: "Continue",
      })[this.modeValue()],
  );
  validForMode() {
    const m = this.modeValue();
    if (m === "verify-email") return !!this.token();
    if (m === "mfa") return this.form.controls.code.valid;
    if (m === "forgot-password") return this.form.controls.email.valid;
    if (m === "reset-password")
      return !!this.token() && this.form.controls.password.valid;
    if (m === "accept-invitation")
      return (
        !!this.token() &&
        this.form.controls.name.valid &&
        this.form.controls.password.valid
      );
    return (
      this.form.controls.email.valid &&
      this.form.controls.password.valid &&
      (m !== "register" || this.form.controls.name.valid)
    );
  }
  submit() {
    if (!this.validForMode()) return;
    this.loading.set(true);
    this.error.set("");
    const v = this.form.getRawValue(),
      m = this.modeValue();
    let request: Observable<unknown>;
    if (m === "login" || m === "session-expired")
      request = from(this.firebase.login(v.email, v.password)).pipe(
        switchMap((idToken) => this.api.exchangeFirebaseToken(idToken)),
      );
    else if (m === "register")
      request = from(this.firebase.register(v.name, v.email, v.password)).pipe(
        switchMap((idToken) => this.api.exchangeFirebaseToken(idToken)),
      );
    else if (m === "forgot-password")
      request = from(this.firebase.requestPasswordReset(v.email)).pipe(
        tap(() =>
          this.success.set(
            "If the address is eligible, reset instructions are on the way.",
          ),
        ),
      );
    else if (m === "reset-password")
      request = this.api
        .resetPassword(this.token(), v.password)
        .pipe(
          tap(() => this.completed("Password updated. You can now sign in.")),
        );
    else if (m === "verify-email")
      request = this.api
        .verifyEmail(this.token())
        .pipe(
          tap(() => this.completed("Email verified. You can now sign in.")),
        );
    else if (m === "accept-invitation")
      request = this.api.acceptInvitation(this.token(), v.name, v.password);
    else
      request = this.api
        .verifyMfa(
          this.challengeId() ||
            this.route.snapshot.queryParamMap.get("challenge") ||
            "",
          v.code,
        )
        .pipe(
          tap((s) => {
            this.session.establish(s);
            void this.router.navigateByUrl("/app/dashboard");
          }),
        );
    request
      .pipe(
        tap((result) => {
          if (
            typeof result === "object" &&
            result !== null &&
            "status" in result
          )
            this.handleResult(result as AuthResult);
        }),
        catchError((error: unknown) => {
          this.error.set(this.authErrorMessage(error));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
  google() {
    this.loading.set(true);
    this.error.set("");
    from(this.firebase.google())
      .pipe(
        switchMap((idToken) => this.api.exchangeFirebaseToken(idToken)),
        tap((result) => this.handleResult(result)),
        catchError((error: unknown) => {
          this.error.set(this.authErrorMessage(error));
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe();
  }
  private token() {
    return this.route.snapshot.queryParamMap.get("token") || "";
  }
  private completed(message: string) {
    this.success.set(message);
  }
  private handleResult(result: AuthResult) {
    if (result.status === "authenticated" && result.session) {
      this.session.establish(result.session);
      void this.router.navigateByUrl(
        this.route.snapshot.queryParamMap.get("returnTo") || "/app/dashboard",
      );
    } else if (result.status === "mfa_required") {
      this.challengeId.set(result.challengeId || "");
      void this.router.navigate(["/auth/mfa"], {
        queryParams: { challenge: result.challengeId },
      });
    } else void this.router.navigateByUrl("/auth/verify-email");
  }
  private authErrorMessage(error: unknown): string {
    const code =
      typeof error === "object" && error !== null && "code" in error
        ? String(error.code)
        : "";
    if (code === "auth/popup-closed-by-user")
      return "Google sign-in was cancelled. Please try again when you’re ready.";
    if (code === "auth/account-exists-with-different-credential")
      return "An account already exists with this email. Sign in using its original method.";
    if (code === "auth/email-already-in-use")
      return "An account already exists with this email. Sign in instead.";
    if (code === "auth/invalid-credential")
      return "The email or password is incorrect.";
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? Number(error.status)
        : undefined;
    if (status === 429)
      return "Too many attempts. Wait a moment and try again.";
    if (status === 0)
      return "We couldn’t reach SanctuaryAI. Check your connection and try again.";
    return "We couldn’t complete sign-in. Check your connection and try again.";
  }
}
