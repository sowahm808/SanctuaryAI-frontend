import "@angular/compiler";
import { describe, expect, it } from "vitest";
import type { EntityId } from "../../models/domain.models";
import { PRAYER_LIST_OPTIONS, prayerResource } from "./prayer.service";

describe("prayer API contract", () => {
  const prayerId = "prayer-1" as EntityId;

  it("requests recent work in backend updated order", () => {
    expect(PRAYER_LIST_OPTIONS).toEqual({
      limit: 20,
      sort: "updatedAt",
      direction: "desc",
    });
  });

  it("uses the dedicated generation and review routes", () => {
    expect(prayerResource(prayerId, "generate")).toBe("prayer-1/generate");
    expect(prayerResource(prayerId, "submit-review")).toBe(
      "prayer-1/submit-review",
    );
  });

  it("uses nested point persistence routes", () => {
    expect(prayerResource(prayerId, "points", "point-2")).toBe(
      "prayer-1/points/point-2",
    );
    expect(prayerResource(prayerId, "points", "order")).toBe(
      "prayer-1/points/order",
    );
  });
});
