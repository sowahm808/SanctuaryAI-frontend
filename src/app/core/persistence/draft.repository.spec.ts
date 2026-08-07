import { describe, expect, it } from "vitest";
import { reconcileDraft } from "./draft.repository";

describe("DraftRepository concurrency recovery", () => {
  it("keeps the detail GET revision authoritative when a recovered draft is stale", () => {
    const result = reconcileDraft(
      {
        key: "declaration:1",
        organizationId: "org-1" as never,
        feature: "declarations",
        payload: { title: "unsaved local title" },
        localRevision: 2,
        serverRevision: "A",
        updatedAt: "2026-08-07T00:00:00Z" as never,
        syncState: "local",
      },
      "B",
    );

    expect(result).toEqual({
      serverRevision: "B",
      recoveredPayload: { title: "unsaved local title" },
      conflict: true,
    });
  });
});
