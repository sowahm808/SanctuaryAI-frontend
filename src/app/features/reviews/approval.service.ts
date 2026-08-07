import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
  type ApiGroup,
} from "../../core/api/api-client.service";
import type { CursorPage, EntityId } from "../../models/domain.models";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
import {
  workflowApiConfig,
  type WorkflowKind,
} from "../workspace/workflow.service";
import type {
  AddReviewCommentRequest,
  AssignReviewRequest,
  EligibleReviewer,
  ReviewComment,
  ReviewDecisionRequest,
  ReviewDetail,
  ReviewQueueFilters,
  ReviewQueueItem,
  SubmitForReviewRequest,
} from "./reviews.models";

/** The single transport boundary for creator and reviewer approval workflows. */
@Injectable({ providedIn: "root" })
export class ApprovalService {
  private readonly api = inject(ApiClientService);

  submitContent(
    kind: WorkflowKind,
    contentId: EntityId,
  ): Observable<ReviewQueueItem> {
    const config = workflowApiConfig(kind);
    return this.api
      .postResource<Record<string, never>, ReviewQueueItem>(
        config.group,
        config.submitReviewResource(contentId),
        {},
      )
      .pipe(map(({ data }) => data));
  }

  submitForReview(input: SubmitForReviewRequest): Observable<ReviewQueueItem> {
    return this.api
      .postResource<Record<string, never>, ReviewQueueItem>(
        contentGroup(input.contentType),
        resourcePath(input.contentId, "submit-review"),
        {},
      )
      .pipe(map(({ data }) => data));
  }

  getForContent(
    contentType: ReviewQueueItem["contentType"],
    contentId: string,
  ): Observable<readonly ReviewQueueItem[]> {
    return this.getQueue({ type: contentType }).pipe(
      map((page) => page.items.filter((item) => item.contentId === contentId)),
    );
  }

  getQueue(
    filters: ReviewQueueFilters = {},
  ): Observable<CursorPage<ReviewQueueItem>> {
    const query = Object.fromEntries(
      Object.entries(filters).filter(
        (entry): entry is [string, string] =>
          typeof entry[1] === "string" && entry[1].length > 0,
      ),
    );
    return this.api
      .collectionPage<ReviewQueueItem>("approvals", query)
      .pipe(unwrapCursorPage());
  }

  getDetail(id: string): Observable<ReviewDetail> {
    return this.api.get<ReviewDetail>("approvals", id).pipe(unwrapData());
  }

  approve(
    id: string,
    request: ReviewDecisionRequest,
  ): Observable<ReviewDetail> {
    return this.decision(id, "approve", request);
  }
  requestChanges(
    id: string,
    request: ReviewDecisionRequest,
  ): Observable<ReviewDetail> {
    return this.decision(id, "request-changes", request);
  }
  reject(id: string, request: ReviewDecisionRequest): Observable<ReviewDetail> {
    return this.decision(id, "reject", request);
  }
  assign(id: string, assigneeId: string): Observable<ReviewDetail> {
    return this.api
      .patchResource<AssignReviewRequest, ReviewDetail>(
        "approvals",
        resourcePath(id, "assignee"),
        { assigneeId },
      )
      .pipe(unwrapData());
  }
  comment(id: string, body: string): Observable<ReviewComment> {
    return this.api
      .postResource<AddReviewCommentRequest, ReviewComment>(
        "approvals",
        resourcePath(id, "comments"),
        { body },
      )
      .pipe(unwrapData());
  }

  getEligibleReviewers(): Observable<CursorPage<EligibleReviewer>> {
    return this.api
      .list<EligibleReviewer>("users", { filters: { eligibleFor: "review" } })
      .pipe(unwrapCursorPage());
  }

  private decision(
    id: string,
    action: string,
    request: ReviewDecisionRequest,
  ): Observable<ReviewDetail> {
    return this.api
      .postResource<ReviewDecisionRequest, ReviewDetail>(
        "approvals",
        resourcePath(id, action),
        request,
      )
      .pipe(unwrapData());
  }
}

function contentGroup(type: SubmitForReviewRequest["contentType"]): ApiGroup {
  const groups: Partial<
    Record<SubmitForReviewRequest["contentType"], ApiGroup>
  > = {
    theme: "themes",
    sermon: "sermons",
    prayer: "prayers",
    declaration: "declarations",
  };
  const group = groups[type];
  if (!group) throw new Error(`Unsupported approval content type: ${type}`);
  return group;
}
