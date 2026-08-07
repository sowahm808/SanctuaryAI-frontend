import "@angular/compiler";
import { describe, expect, it } from "vitest";
import type {
  ThemeDraftForm,
  ThemeRefinementAction,
  ThemeTimelineEvent,
  ThemeVersion,
} from "./theme.models";

describe("theme production contracts", () => {
  it("keeps month and year structured and rich inputs typed", () => {
    const draft: ThemeDraftForm = {
      month: 8,
      year: 2026,
      topic: "Wisdom",
      mainScripture: "James 1:5",
      supportingScriptures: ["Proverbs 4:7", "Colossians 2:3"],
      spiritualEmphasis: "Maturity",
      pastorNotes: "Teach with warmth",
      previousTheme: "Faith",
      upcomingEvents: ["Leadership retreat — 2026-08-15"],
      tone: "pastoral",
      intendedAudience: ["whole-church"],
    };
    expect(draft.month).toBe(8);
    expect(draft.year).toBe(2026);
    expect(draft.supportingScriptures).toHaveLength(2);
    expect(draft.upcomingEvents[0]).toContain("2026");
  });
  it("defines backend refinement actions without display-label coupling", () => {
    const actions: ThemeRefinementAction[] = [
      "more_prophetic",
      "more_pastoral",
      "simplify",
      "add_scriptures",
      "shorten",
      "expand",
      "create_alternatives",
    ];
    expect(actions).toContain("create_alternatives");
  });
  it("tracks timeline events and versions by stable ids", () => {
    const event = {
      id: "event-1",
      label: "Theme generated",
      timestamp: "2026-08-07T00:00:00Z",
      revision: 2,
    } as ThemeTimelineEvent;
    const version = {
      id: "version-2",
      revision: 2,
      createdAt: event.timestamp,
      status: "version_ready",
    } as ThemeVersion;
    expect(event.revision).toBe(version.revision);
    expect(event.id).not.toBe(version.id);
  });
});
