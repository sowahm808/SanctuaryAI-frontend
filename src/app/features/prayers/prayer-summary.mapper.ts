import type {
  PrayerCategory,
  PrayerStatus,
  PrayerSummaryDto,
  PrayerSummaryView,
  ScriptureReference,
} from "./prayer.models";
import {
  PRAYER_CATEGORIES,
  PRAYER_STATUS_LABELS,
  formatScripture,
  prayerTitle,
} from "./prayer.models";

const positiveInteger = (value: unknown): number | undefined => {
  if (value === null || value === undefined || value === "") return undefined;
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number >= 0 ? number : undefined;
};

const validCategory = (value: unknown): PrayerCategory | undefined =>
  PRAYER_CATEGORIES.find((category) => category === value);

const validStatus = (value: unknown): PrayerStatus =>
  typeof value === "string" && Object.hasOwn(PRAYER_STATUS_LABELS, value)
    ? (value as PrayerStatus)
    : "draft";

const scriptureLabel = (
  value: ScriptureReference | null | undefined,
): string | undefined => {
  if (!value?.book?.trim() || !positiveInteger(value.chapter)) return undefined;
  const label = formatScripture(value);
  return label === "Scripture not set" ? undefined : label;
};

const relativeUpdated = (date: Date | undefined, now: Date): string => {
  if (!date) return "Updated recently";
  const minutes = Math.max(
    0,
    Math.floor((now.getTime() - date.getTime()) / 60000),
  );
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes}m ago`;
  if (minutes < 24 * 60) return `Updated ${Math.floor(minutes / 60)}h ago`;
  if (minutes < 48 * 60) return "Updated yesterday";
  return `Updated ${date.toLocaleDateString("en", { month: "short", day: "numeric" })}`;
};

export function toPrayerSummaryView(
  dto: PrayerSummaryDto,
  now = new Date(),
): PrayerSummaryView {
  const category = validCategory(dto.category);
  const theme = dto.theme?.trim() || undefined;
  const explicitTitle = dto.collectionTitle?.trim() || dto.title?.trim() || "";
  const status = validStatus(dto.status);
  const scripture = scriptureLabel(dto.primaryScripture || dto.scripture);
  const count =
    positiveInteger(dto.pointCount) ??
    (dto.prayerPoints ? dto.prayerPoints.length : undefined) ??
    positiveInteger(dto.quantity);
  const currentVersion =
    typeof dto.currentVersion === "object"
      ? dto.currentVersion?.number
      : dto.currentVersion;
  const version =
    positiveInteger(dto.versionNumber) ??
    positiveInteger(dto.sequence) ??
    positiveInteger(currentVersion) ??
    positiveInteger(dto.version) ??
    positiveInteger(dto.revision);
  const parsedDate = dto.updatedAt ? new Date(dto.updatedAt) : undefined;
  const updatedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : undefined;

  return {
    id: dto.id,
    title: prayerTitle({
      title: explicitTitle,
      theme: theme || "",
      category: category as PrayerCategory,
    }),
    theme,
    category,
    categoryLabel: category || "Prayer collection",
    status,
    statusLabel: PRAYER_STATUS_LABELS[status],
    scriptureLabel: scripture,
    prayerPointCount: count,
    versionLabel: version === undefined ? undefined : `v${version}`,
    updatedAt,
    updatedLabel: relativeUpdated(updatedAt, now),
  };
}
