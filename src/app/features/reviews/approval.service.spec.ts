import "@angular/compiler";
import {
  createEnvironmentInjector,
  runInInjectionContext,
} from "@angular/core";
import { of } from "rxjs";
import { describe, expect, it, vi } from "vitest";
import { ApiClientService } from "../../core/api/api-client.service";
import { ApprovalService } from "./approval.service";

describe("ApprovalService", () => {
  it("submits governed content through its resource submit-review endpoint", () => {
    const approval = {
      id: "approval-1",
      contentId: "theme-1",
      contentVersionId: "theme-version-2",
      contentType: "theme",
      status: "pending",
    };
    const api = {
      postResource: vi.fn(() =>
        of({ data: approval, correlationId: "request-1" }),
      ),
    };
    const injector = createEnvironmentInjector([
      ApprovalService,
      { provide: ApiClientService, useValue: api },
    ]);
    const service = runInInjectionContext(injector, () =>
      injector.get(ApprovalService),
    );

    service
      .submitForReview({
        contentId: "theme-1",
        contentVersionId: "theme-version-2",
        contentType: "theme",
        priority: "normal",
      })
      .subscribe((result) => expect(result).toBe(approval));

    expect(api.postResource).toHaveBeenCalledWith(
      "themes",
      "theme-1/submit-review",
      {},
    );
  });

  it("unwraps the cursor page exactly once", () => {
    const page = { items: [], nextCursor: "next" };
    const api = {
      collectionPage: vi.fn(() =>
        of({ data: page, correlationId: "request-2" }),
      ),
    };
    const injector = createEnvironmentInjector([
      ApprovalService,
      { provide: ApiClientService, useValue: api },
    ]);
    const service = runInInjectionContext(injector, () =>
      injector.get(ApprovalService),
    );

    service.getQueue().subscribe((result) => expect(result).toEqual(page));
  });
});
