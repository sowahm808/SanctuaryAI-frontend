import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type { CursorPage, EntityId } from "../../models/domain.models";
import type {
  AddReviewCommentRequest,
  AssignReviewRequest,
  EligibleReviewer,
  ReviewComment,
  ReviewDecisionRequest,
  ReviewDetail,
  ReviewQueueFilters,
  ReviewQueueItem,
} from "./reviews.models";

@Injectable({ providedIn: "root" })
export class ReviewsService {
  private readonly api = inject(ApiClientService);

  getReviewQueue(
    filters: ReviewQueueFilters = {},
  ): Observable<readonly ReviewQueueItem[]> {
    const queryFilters = Object.fromEntries(
      Object.entries(filters).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
    return this.api
      .collection<ReviewQueueItem>("approvals", queryFilters)
      .pipe(map((r) => r.data));
  }
  getReviewById(id: string): Observable<ReviewDetail> {
    return this.api
      .get<ReviewDetail>("approvals", id as EntityId)
      .pipe(map((r) => r.data));
  }
  approve(id: string, body: ReviewDecisionRequest): Observable<ReviewDetail> {
    return this.mutate(id, "approve", body);
  }
  requestChanges(
    id: string,
    body: ReviewDecisionRequest,
  ): Observable<ReviewDetail> {
    return this.mutate(id, "request-changes", body);
  }
  reject(id: string, body: ReviewDecisionRequest): Observable<ReviewDetail> {
    return this.mutate(id, "reject", body);
  }
  assign(id: string, body: AssignReviewRequest): Observable<ReviewDetail> {
    return this.api
      .patchResource<AssignReviewRequest, ReviewDetail>(
        "approvals",
        `${id}/assignee`,
        body,
      )
      .pipe(map((r) => r.data));
  }
  addComment(
    id: string,
    body: AddReviewCommentRequest,
  ): Observable<ReviewComment> {
    return this.api
      .postResource<AddReviewCommentRequest, ReviewComment>(
        "approvals",
        `${id}/comments`,
        body,
      )
      .pipe(map((r) => r.data));
  }
  getEligibleReviewers(): Observable<CursorPage<EligibleReviewer>> {
    return this.api
      .list<EligibleReviewer>("users", { filters: { eligibleFor: "review" } })
      .pipe(map((r) => r.data));
  }
  private mutate(
    id: string,
    action: string,
    body: ReviewDecisionRequest,
  ): Observable<ReviewDetail> {
    return this.api
      .postResource<ReviewDecisionRequest, ReviewDetail>(
        "approvals",
        `${id}/${action}`,
        body,
      )
      .pipe(map((r) => r.data));
  }
}
