import { Injectable, inject } from "@angular/core";
import {
  Observable,
  distinctUntilChanged,
  expand,
  map,
  switchMap,
  takeWhile,
  timer,
} from "rxjs";
import type { AsyncJob, EntityId } from "../../models/domain.models";
import { ApiClientService } from "../api/api-client.service";
import { validJob } from "./ai-job.validation";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

/** Tracks server-owned AI work. The browser never calls an AI provider directly. */
@Injectable({ providedIn: "root" })
export class AiJobService {
  private readonly api = inject(ApiClientService);

  watch<TResult>(initial: AsyncJob<TResult>): Observable<AsyncJob<TResult>> {
    return new Observable<AsyncJob<TResult>>((subscriber) => {
      if (!validJob(initial)) {
        subscriber.error(new Error("The server returned an invalid AI job."));
        return;
      }
      subscriber.next(initial);
      subscriber.complete();
    }).pipe(
      expand((job) =>
        TERMINAL_STATUSES.has(job.status)
          ? []
          : timer(1500).pipe(
              switchMap(() =>
                this.api
                  .get<AsyncJob<TResult>>("jobs", job.id)
                  .pipe(map((response) => response.data)),
              ),
              map((next) => {
                if (!validJob(next))
                  throw new Error("The server returned an invalid AI job.");
                return next;
              }),
            ),
      ),
      distinctUntilChanged(
        (previous, current) =>
          previous.status === current.status &&
          previous.progress === current.progress &&
          previous.message === current.message,
      ),
      takeWhile((job) => !TERMINAL_STATUSES.has(job.status), true),
    );
  }

  cancel(id: EntityId): Observable<AsyncJob> {
    return this.api
      .postResource<Record<string, never>, AsyncJob>("jobs", `${id}/cancel`, {})
      .pipe(map((response) => response.data));
  }
}
