import { Injectable, inject } from "@angular/core";
import {
  expand,
  last,
  of,
  switchMap,
  takeWhile,
  timer,
  type Observable,
} from "rxjs";
import type { AsyncJobView, RevisionToken } from "../flyer.models";
import { FlyerApiService } from "./flyer-api.service";
@Injectable({ providedIn: "root" })
export class FlyerRenderService {
  private api = inject(FlyerApiService);
  render(id: string, revision: RevisionToken): Observable<AsyncJobView> {
    return this.api
      .generate(id, revision)
      .pipe(switchMap((job) => this.poll(job)));
  }
  export(
    id: string,
    variantId: string,
    format: "png" | "jpg" | "webp" | "pdf",
  ) {
    return this.api
      .export(id, variantId, format)
      .pipe(switchMap((job) => this.poll(job)));
  }
  private poll(job: AsyncJobView): Observable<AsyncJobView> {
    return of(job).pipe(
      expand((current) =>
        current.status === "queued" || current.status === "running"
          ? timer(1000).pipe(switchMap(() => this.api.job(current.id)))
          : of(),
      ),
      takeWhile(Boolean, true),
      last(),
    );
  }
}
