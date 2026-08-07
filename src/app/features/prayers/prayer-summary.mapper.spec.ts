import { describe, expect, it } from "vitest";
import type { EntityId, IsoDateTime } from "../../models/domain.models";
import type { PrayerSummaryDto } from "./prayer.models";
import { toPrayerSummaryView } from "./prayer-summary.mapper";

const summary = (
  changes: Partial<PrayerSummaryDto> = {},
): PrayerSummaryDto => ({
  id: "prayer-1" as EntityId,
  status: "draft",
  updatedAt: "2026-08-06T12:00:00Z" as IsoDateTime,
  ...changes,
});

describe("prayer summary view mapper", () => {
  const now = new Date("2026-08-07T12:00:00Z");

  it("prioritizes a persisted explicit collection title and preserves theme", () => {
    const view = toPrayerSummaryView(
      summary({
        collectionTitle: "Financial Empowerment Prayers",
        title: "Legacy title",
        theme: "Financial empowerment",
      }),
      now,
    );
    expect(view.title).toBe("Financial Empowerment Prayers");
    expect(view.theme).toBe("Financial empowerment");
  });

  it("falls back safely from theme to category to a generic title", () => {
    expect(
      toPrayerSummaryView(summary({ theme: "Divine enlargement" }), now).title,
    ).toBe("Divine enlargement Prayers");
    expect(
      toPrayerSummaryView(summary({ category: "Healing" }), now).title,
    ).toBe("Healing Prayer Collection");
    expect(
      toPrayerSummaryView(summary({ title: null, theme: null }), now).title,
    ).toBe("Prayer Collection");
  });

  it("omits missing scripture and displays structured scripture", () => {
    expect(
      toPrayerSummaryView(summary({ primaryScripture: null }), now)
        .scriptureLabel,
    ).toBeUndefined();
    expect(
      toPrayerSummaryView(
        summary({
          primaryScripture: { book: "Isaiah", chapter: 54, verses: "2–3" },
        }),
        now,
      ).scriptureLabel,
    ).toBe("Isaiah 54:2–3");
  });

  it("uses actual point data and supports legacy quantity", () => {
    expect(
      toPrayerSummaryView(summary({ pointCount: 20 }), now).prayerPointCount,
    ).toBe(20);
    expect(
      toPrayerSummaryView(summary({ pointCount: null, quantity: 12 }), now)
        .prayerPointCount,
    ).toBe(12);
  });

  it("never presents opaque revisions as versions", () => {
    expect(
      toPrayerSummaryView(
        summary({ revision: "73765a28-5944-4200-97f9-0bcb07d48700" }),
        now,
      ).versionLabel,
    ).toBeUndefined();
    expect(
      toPrayerSummaryView(summary({ versionNumber: 3 }), now).versionLabel,
    ).toBe("v3");
  });

  it("normalizes null legacy fields without throwing", () => {
    expect(() =>
      toPrayerSummaryView(
        summary({
          status: null,
          title: null,
          theme: null,
          prayerPoints: null,
          updatedAt: null,
        }),
        now,
      ),
    ).not.toThrow();
  });
});
