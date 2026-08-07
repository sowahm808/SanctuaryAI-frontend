import "@angular/compiler";
import { describe, expect, it } from "vitest";
import { workflowApiConfig } from "./workflow.service";

const entityId = "entity-1" as never;

describe("workflowApiConfig", () => {
  it("routes theme generation through the themes API", () => {
    const config = workflowApiConfig("themes");

    expect(config.group).toBe("themes");
    expect(config.generateResource(entityId)).toBe("entity-1/generate");
  });

  it("routes prayer point generation through the prayers API", () => {
    const config = workflowApiConfig("prayer-points");

    expect(config.group).toBe("prayers");
    expect(config.generateResource(entityId)).toBe("entity-1/generate");
  });

  it("routes approval submission through the content resource", () => {
    expect(
      workflowApiConfig("declarations").submitReviewResource(entityId),
    ).toBe("entity-1/submit-review");
  });

  it("fails explicitly instead of falling back to themes", () => {
    expect(() => workflowApiConfig("unsupported" as never)).toThrow(
      "Unsupported workflow kind: unsupported",
    );
  });
});
