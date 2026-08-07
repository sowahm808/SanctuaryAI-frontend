import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type { ApiResponse, CursorPage } from "../../models/domain.models";
import type {
  ReviewDetail,
  ReviewQueueFilters,
  ReviewQueueItem,
  SubmitForReviewRequest,
} from "./reviews.models";

/** The single transport boundary for creator and reviewer approval workflows. */
@Injectable({ providedIn: "root" })
export class ApprovalService {
  private readonly api = inject(ApiClientService);

  submitForReview(input: SubmitForReviewRequest): Observable<ReviewQueueItem> {
    return this.api
      .create<SubmitForReviewRequest, ReviewQueueItem>("approvals", input)
      .pipe(map((response) => response.data));
  }

  getForContent(
    contentType: SubmitForReviewRequest["contentType"],
    contentId: string,
  ): Observable<readonly ReviewQueueItem[]> {
    return this.getQueue({ type: contentType }).pipe(
      map((response) =>
        response.data.items.filter((item) => item.contentId === contentId),
      ),
    );
  }

  getQueue(
    filters: ReviewQueueFilters = {},
  ): Observable<ApiResponse<CursorPage<ReviewQueueItem>>> {
    const query = Object.fromEntries(
      Object.entries(filters).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].length > 0,
      ),
    );
    return this.api.collectionPage<ReviewQueueItem>("approvals", query).pipe(
      map((response) => ({
        ...response,
        data: normalizePage(response.data),
      })),
    );
  }

  getById(id: string): Observable<ReviewDetail> {
    return this.api
      .get<ReviewDetail>("approvals", id as never)
      .pipe(map((response) => response.data));
  }
}

function normalizePage<T>(value: CursorPage<T> | readonly T[]): CursorPage<T> {
  if (Array.isArray(value)) return { items: value };
  const page = value as CursorPage<T> | null | undefined;
  return {
    ...(page ?? {}),
    items: Array.isArray(page?.items) ? page.items : [],
  };
}
