import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type { ApiResponse } from "../../models/domain.models";
import type { DashboardSummary } from "./dashboard.models";
import { normalizeDashboardSummary } from "./dashboard-normalizer";

@Injectable({ providedIn: "root" })
export class DashboardService {
  private readonly api = inject(ApiClientService);

  summary(): Observable<DashboardSummary> {
    return this.api
      .getSingleton<DashboardSummary>("dashboard", "summary")
      .pipe(
        map((response) =>
          normalizeDashboardSummary(readResponseData(response)),
        ),
      );
  }
}

function readResponseData<T>(response: ApiResponse<T> | T): T {
  return isApiResponse(response) ? response.data : response;
}

function isApiResponse<T>(
  response: ApiResponse<T> | T,
): response is ApiResponse<T> {
  return (
    typeof response === "object" &&
    response !== null &&
    "data" in response &&
    typeof (response as { data: unknown }).data === "object"
  );
}
