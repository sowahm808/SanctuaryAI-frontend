import { Injectable, signal } from "@angular/core";
import {
  Subject,
  debounceTime,
  filter,
  finalize,
  switchMap,
  type Observable,
} from "rxjs";
@Injectable({ providedIn: "root" })
export class FlyerAutosaveService {
  private requests = new Subject<() => Observable<unknown>>();
  readonly saving = signal(false);
  constructor() {
    this.requests
      .pipe(
        debounceTime(1500),
        filter(() => !this.saving()),
        switchMap((factory) => {
          this.saving.set(true);
          return factory().pipe(finalize(() => this.saving.set(false)));
        }),
      )
      .subscribe({ error: () => this.saving.set(false) });
  }
  schedule(factory: () => Observable<unknown>) {
    this.requests.next(factory);
  }
}
