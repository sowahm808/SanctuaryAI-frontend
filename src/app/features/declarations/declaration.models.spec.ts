import { describe, expect, it } from "vitest";
import {
  AUDIENCES,
  DECLARATION_TONES,
  DECLARATION_TYPES,
  SERVICE_TYPES,
  declarationTitle,
  normalizeDeclarationStatus,
  statusLabel,
  toDeclarationSummaryView,
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
  it.each([
    [null, "draft", "Draft"],
    [undefined, "draft", "Draft"],
    ["draft", "draft", "Draft"],
    ["version_ready", "version_ready", "Version ready"],
    ["changes_requested", "changes_requested", "Changes requested"],
    ["unknown", "draft", "Draft"],
  ])("normalizes status %s", (input, status, label) => {
    expect(normalizeDeclarationStatus(input)).toBe(status);
    expect(statusLabel(input)).toBe(label);
  });

  it("maps nullable legacy summaries to a safe view model", () => {
    const item = toDeclarationSummaryView({
      id: "legacy-id",
      title: null,
      status: null,
      revision: "550e8400-e29b-41d4-a716-446655440000",
      declarationType: null,
      audience: null,
      updatedAt: null,
      brief: { objective: "Divine enlargement", tone: null },
    });
    expect(item).toMatchObject({
      title: "Divine enlargement Declaration",
      status: "draft",
      statusLabel: "Draft",
      revision: null,
      revisionLabel: null,
      declarationTypeLabel: null,
      updatedAt: null,
    });
  });

  it("labels numeric revisions without presenting legacy UUIDs as revisions", () => {
    expect(
      toDeclarationSummaryView({ id: "new-id", revision: 3 })?.revisionLabel,
    ).toBe("v3");
    expect(
      toDeclarationSummaryView({ id: "old-id", revision: "revision-uuid" })
        ?.revisionLabel,
    ).toBeNull();
  });
});
