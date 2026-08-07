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
  it("submits an exact governed content version to the canonical endpoint", () => {
    const approval = {
      id: "approval-1",
      contentId: "theme-1",
      contentVersionId: "theme-version-2",
      contentType: "theme",
      status: "pending",
    };
    const api = {
      create: vi.fn(() => of({ data: approval, correlationId: "request-1" })),
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

    expect(api.create).toHaveBeenCalledWith("approvals", {
      contentId: "theme-1",
      contentVersionId: "theme-version-2",
      contentType: "theme",
      priority: "normal",
    });
  });

  it("normalizes a malformed empty collection to an iterable page", () => {
    const api = {
      collectionPage: vi.fn(() =>
        of({ data: {} as never, correlationId: "request-2" }),
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
      .getQueue()
      .subscribe((result) => expect(result.data.items).toEqual([]));
  });
});
