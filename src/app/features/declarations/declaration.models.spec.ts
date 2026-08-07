import { describe, expect, it } from "vitest";
import {
  AUDIENCES,
  DECLARATION_TONES,
  DECLARATION_TYPES,
  SERVICE_TYPES,
  declarationTitle,
  statusLabel,
} from "./declaration.models";
describe("declaration domain configuration", () => {
  it("uses controlled brief options", () => {
    expect(DECLARATION_TYPES).toContain("Prophetic");
    expect(DECLARATION_TONES).toContain("Covenant");
    expect(AUDIENCES).toContain("Entire congregation");
    expect(SERVICE_TYPES).toContain("Sunday Service");
  });
  it("does not expose Untitled content", () => {
    expect(
      declarationTitle({
        title: "Untitled content",
        objective: "Speak healing and restoration",
      }),
    ).toBe("Speak healing and restoration Declaration");
  });
  it("formats backend workflow statuses", () =>
    expect(statusLabel("awaiting_approval")).toBe("Awaiting Approval"));
});
