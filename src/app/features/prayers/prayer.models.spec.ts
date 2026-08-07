import { describe, expect, it } from "vitest";
import {
  PRAYER_CATEGORIES,
  PRAYER_TONES,
  formatScripture,
  prayerTitle,
} from "./prayer.models";

describe("prayer domain models", () => {
  it("keeps category and tone values controlled", () => {
    expect(PRAYER_CATEGORIES).toContain("Financial Breakthrough");
    expect(PRAYER_TONES).toContain("Prophetic");
    expect(PRAYER_CATEGORIES).not.toContain("prophecy" as never);
  });

  it("normalizes a structured scripture reference", () => {
    expect(formatScripture({ book: "3 John", chapter: 1, verses: "2" })).toBe(
      "3 John 1:2",
    );
  });

  it("uses explicit title, then theme, then category", () => {
    expect(
      prayerTitle({
        title: "Covenant Prosperity",
        theme: "Finance",
        category: "Financial Breakthrough",
      }),
    ).toBe("Covenant Prosperity");
    expect(
      prayerTitle({
        title: "Untitled content",
        theme: "Financial Empowerment",
        category: "Financial Breakthrough",
      }),
    ).toBe("Financial Empowerment Prayers");
    expect(prayerTitle({ title: "", theme: "", category: "Healing" })).toBe(
      "Healing Prayer Collection",
    );
  });
});
