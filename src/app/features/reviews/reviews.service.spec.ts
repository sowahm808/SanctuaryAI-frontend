import "@angular/compiler";
import {
  createEnvironmentInjector,
  runInInjectionContext,
} from "@angular/core";
import { of } from "rxjs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientService } from "../../core/api/api-client.service";
import type { ReviewDetail } from "./reviews.models";
import { ReviewsService } from "./reviews.service";

const detail = {
  id: "review_1",
  contentId: "theme_1",
  contentType: "theme",
  title: "August theme",
  ownerId: "user_1",
  ownerName: "Author",
  priority: "high",
  status: "pending",
  submittedAt: "2026-08-01T00:00:00Z",
  updatedAt: "2026-08-01T00:00:00Z",
  proposedVersion: {
    id: "v1",
    versionNumber: 1,
    content: { title: "Grace" },
    createdAt: "2026-08-01T00:00:00Z",
  },
  comments: [],
  auditHistory: [],
  allowedActions: {
    approve: true,
    reject: true,
    requestChanges: true,
    assign: true,
    comment: true,
  },
} satisfies ReviewDetail;

describe("ReviewsService", () => {
  const api = {
    list: vi.fn(),
    collectionPage: vi.fn(),
    get: vi.fn(),
    postResource: vi.fn(),
    patchResource: vi.fn(),
  };
  let service: ReviewsService;
  beforeEach(() => {
    vi.clearAllMocks();
    const injector = createEnvironmentInjector([
      ReviewsService,
      { provide: ApiClientService, useValue: api },
    ]);
    service = runInInjectionContext(injector, () =>
      injector.get(ReviewsService),
    );
  });
  it("loads the explicit approval queue with server filters", () => {
    api.collectionPage.mockReturnValue(
      of({ data: { items: [detail], total: 1 }, correlationId: "c1" }),
    );
    service
      .getReviewQueue({ type: "theme" })
      .subscribe((response) =>
        expect(response.data.items[0]?.id).toBe("review_1"),
      );
    expect(api.collectionPage).toHaveBeenCalledWith("approvals", {
      type: "theme",
    });
  });
  it("omits unset approval filters", () => {
    api.collectionPage.mockReturnValue(
      of({ data: { items: [], total: 0 }, correlationId: "c1" }),
    );

    service
      .getReviewQueue()
      .subscribe((response) => expect(response.data.items).toEqual([]));

    expect(api.collectionPage).toHaveBeenCalledWith("approvals", {});
  });
  it("loads persisted review details", () => {
    api.get.mockReturnValue(of({ data: detail, correlationId: "c1" }));
    service
      .getReviewById("review_1")
      .subscribe((result) =>
        expect(result.proposedVersion.content).toEqual({ title: "Grace" }),
      );
    expect(api.get).toHaveBeenCalledWith("approvals", "review_1");
  });
  it.each([
    ["approve", "approve"],
    ["reject", "reject"],
    ["requestChanges", "request-changes"],
  ] as const)("persists %s decisions", (method, path) => {
    api.postResource.mockReturnValue(of({ data: detail, correlationId: "c1" }));
    service[method]("review_1", { reason: "Policy" }).subscribe();
    expect(api.postResource).toHaveBeenCalledWith(
      "approvals",
      `review_1/${path}`,
      { reason: "Policy" },
    );
  });
  it("persists assignments and comments on nested resources", () => {
    api.patchResource.mockReturnValue(
      of({ data: detail, correlationId: "c1" }),
    );
    api.postResource.mockReturnValue(
      of({ data: { id: "comment_1" }, correlationId: "c2" }),
    );
    service.assign("review_1", { assigneeId: "reviewer_1" }).subscribe();
    service.addComment("review_1", { body: "Please verify this." }).subscribe();
    expect(api.patchResource).toHaveBeenCalledWith(
      "approvals",
      "review_1/assignee",
      { assigneeId: "reviewer_1" },
    );
    expect(api.postResource).toHaveBeenCalledWith(
      "approvals",
      "review_1/comments",
      { body: "Please verify this." },
    );
  });
});
