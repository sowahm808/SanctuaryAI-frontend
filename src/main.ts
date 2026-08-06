import { ErrorHandler } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { AppComponent } from "./app/app.component";
import { ChunkLoadErrorHandler } from "./app/core/error/chunk-load-error-handler";
import { routes } from "./app/app.routes";
import { authInterceptor } from "./app/interceptors/auth.interceptor";
import { loadRuntimeConfig } from "./app/core/config/runtime-config";
import { environment } from "./environments/environment";

loadRuntimeConfig(environment.configUrl)
  .then(() =>
    bootstrapApplication(AppComponent, {
      providers: [
        provideRouter(routes, withComponentInputBinding()),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideAnimationsAsync(),
        { provide: ErrorHandler, useClass: ChunkLoadErrorHandler },
      ],
    }),
  )
  .catch((error: unknown) => {
    console.error("SanctuaryAI failed to start.", error);
    showStartupError();
  });

function showStartupError(): void {
  const root = document.querySelector("app-root");
  if (!root) return;

  root.innerHTML = `
    <main class="startup-status startup-status--error" role="alert">
      <img src="/logo.svg" alt="SanctuaryAI" class="startup-status__logo" />
      <div class="startup-status__card">
        <p class="startup-status__eyebrow">Connection problem</p>
        <h1>We couldn’t load SanctuaryAI</h1>
        <p>The application configuration is unavailable. Check your connection and try again.</p>
        <button type="button" class="startup-status__retry">Try again</button>
      </div>
    </main>`;

  root
    .querySelector<HTMLButtonElement>(".startup-status__retry")
    ?.addEventListener("click", () => window.location.reload());
}
