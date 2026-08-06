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
  .catch(console.error);
