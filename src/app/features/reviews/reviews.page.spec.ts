import "@angular/compiler";
import "zone.js";
import "zone.js/testing";
import { TestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { NEVER, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import type { ReviewDetail } from "./reviews.models";
import { ReviewsPage } from "./reviews.page";
import { ReviewsService } from "./reviews.service";

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());

const submittedReview: ReviewDetail = {
  id: "review_persisted_1",
  contentId: "sermon_1",
  contentType: "sermon",
  title: "Persisted Sunday sermon",
  ownerId: "author_1",
  ownerName: "Pastor Grace",
  priority: "high",
  status: "pending",
  submittedAt: "2026-08-07T01:00:00Z",
  updatedAt: "2026-08-07T01:00:00Z",
  proposedVersion: {
    id: "version_1",
    versionNumber: 1,
    content: { title: "Living Hope" },
    createdAt: "2026-08-07T01:00:00Z",
  },
  comments: [],
  auditHistory: [],
  allowedActions: {
    approve: true,
    reject: true,
    requestChanges: true,
    assign: false,
    comment: true,
  },
};

describe("ReviewsPage", () => {
  it("renders a submitted approval from the paginated API envelope", async () => {
    const reviews = {
      getReviewQueue: vi.fn(() =>
        of({
          data: { items: [submittedReview], total: 1 },
          correlationId: "queue-correlation",
        }),
      ),
      getReviewById: vi.fn(() => NEVER),
      getEligibleReviewers: vi.fn(() => of({ items: [], total: 0 })),
    };
    await TestBed.configureTestingModule({
      imports: [ReviewsPage],
      providers: [{ provide: ReviewsService, useValue: reviews }],
    }).compileComponents();

    const fixture = TestBed.createComponent(ReviewsPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      "Persisted Sunday sermon",
    );
    expect(fixture.componentInstance.queue()).toEqual([submittedReview]);
    expect(fixture.componentInstance.comments()).toEqual([]);
    expect(fixture.componentInstance.audits()).toEqual([]);
  });
});
