import "@angular/compiler";
import { describe, expect, it } from "vitest";
import type { AsyncJob, EntityId } from "../../models/domain.models";
import { isTerminalJob } from "./ai-job.service";
import { validJob } from "./ai-job.validation";

const id = "job-1" as EntityId;

describe("AI job contract validation", () => {
  it("accepts a bounded server job", () => {
    expect(validJob({ id, status: "running", progress: 45 })).toBe(true);
  });

  it("rejects invalid status and progress values", () => {
    expect(validJob({ id, status: "running", progress: 101 })).toBe(false);
    expect(
      validJob({ id, status: "unknown", progress: 10 } as unknown as AsyncJob),
    ).toBe(false);
  });
});

describe("AI job polling", () => {
  it.each(["completed", "failed", "cancelled"] as const)(
    "recognizes %s as terminal",
    (status) => {
      expect(isTerminalJob({ status })).toBe(true);
    },
  );

  it.each(["queued", "running"] as const)("continues polling %s", (status) => {
    expect(isTerminalJob({ status })).toBe(false);
  });
});
