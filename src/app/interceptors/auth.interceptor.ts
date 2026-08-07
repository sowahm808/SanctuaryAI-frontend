import {
  HttpContextToken,
  HttpErrorResponse,
  type HttpInterceptorFn,
} from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";
import { SessionService } from "../services/session.service";

const SESSION_RETRY = new HttpContextToken(() => false);

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(SessionService);
  const correlated = request.clone({
    setHeaders: { "X-Correlation-ID": crypto.randomUUID() },
  });
  return next(correlated).pipe(
    catchError((error: HttpErrorResponse) => {
      if (
        error.status !== 401 ||
        request.context.get(SESSION_RETRY) ||
        /\/auth\/(session|logout|firebase)$/.test(request.url)
      )
        return throwError(() => error);

      return session.recoverExpiredSession().pipe(
        switchMap((restored) => {
          if (!restored) {
            session.expire();
            return throwError(() => error);
          }
          return next(
            correlated.clone({
              context: correlated.context.set(SESSION_RETRY, true),
            }),
          );
        }),
      );
    }),
  );
};
