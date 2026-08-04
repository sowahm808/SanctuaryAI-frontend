import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type { DashboardSummary } from "./dashboard.models";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly api = inject(ApiClientService);

  summary(): Observable<DashboardSummary> {
    return this.api
      .getSingleton<DashboardSummary>("dashboard", "summary")
      .pipe(map((response) => response.data));
  }
}
