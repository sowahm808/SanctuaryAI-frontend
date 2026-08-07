import type {
  AsyncJob,
  EntityId,
  IsoDateTime,
} from "../../models/domain.models";

export const PRAYER_CATEGORIES = [
  "Intercession",
  "Thanksgiving",
  "Spiritual Warfare",
  "Healing",
  "Deliverance",
  "Family",
  "Financial Breakthrough",
  "Leadership",
  "Church Growth",
  "Missions",
  "Personal Growth",
  "Favor",
  "Protection",
  "Revival",
  "Prophetic Prayer",
  "Other",
] as const;
export const PRAYER_TONES = [
  "Pastoral",
  "Prophetic",
  "Covenant",
  "Declarative",
  "Intercessory",
  "Warfare",
  "Encouraging",
  "Teaching",
] as const;
export type PrayerCategory = (typeof PRAYER_CATEGORIES)[number];
export type PrayerTone = (typeof PRAYER_TONES)[number];
export type PrayerStatus =
  | "draft"
  | "generating"
  | "version_ready"
  | "pending_approval"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "failed";

export interface ScriptureReference {
  book: string;
  chapter: number;
  verses: string;
}
export interface PrayerAdvancedOptions {
  includeScriptureText: boolean;
  includeDeclaration: boolean;
  includeCongregationalResponse: boolean;
  includeIntroduction: boolean;
  includeClosingDeclaration: boolean;
  bibleTranslation: string;
  audience: string;
  serviceContext: string;
  campaign: string;
}
export interface PrayerDraftForm {
  title: string;
  quantity: number;
  theme: string;
  primaryScripture: ScriptureReference;
  supportingScriptures: ScriptureReference[];
  category: PrayerCategory;
  tone: PrayerTone;
  advancedOptions: PrayerAdvancedOptions;
}
export interface PrayerPoint {
  id: EntityId;
  order: number;
  text: string;
  scripture?: ScriptureReference;
  declaration?: string;
}
export interface PrayerRecord {
  id: EntityId;
  revisionToken: string;
  versionNumber?: number;
  currentVersionId?: EntityId;
  title: string;
  status: PrayerStatus;
  brief: PrayerDraftForm;
  points: readonly PrayerPoint[];
  introduction?: string;
  closingDeclaration?: string;
  updatedAt: IsoDateTime;
}
export interface PrayerDetailDto extends Omit<PrayerRecord, "revisionToken"> {
  revision: string;
}

export function toPrayerView(dto: PrayerDetailDto): PrayerRecord {
  const { revision, ...record } = dto;
  return { ...record, revisionToken: revision };
}
/** The list endpoint has evolved; keep its transport shape separate from the UI. */
export interface PrayerSummaryDto {
  id: EntityId;
  revision?: number | string | null;
  version?: number | string | null;
  versionNumber?: number | null;
  sequence?: number | null;
  currentVersion?: number | { number?: number | null } | null;
  title?: string | null;
  collectionTitle?: string | null;
  status?: PrayerStatus | null;
  theme?: string | null;
  category?: PrayerCategory | null;
  primaryScripture?: ScriptureReference | null;
  scripture?: ScriptureReference | null;
  pointCount?: number | null;
  quantity?: number | null;
  prayerPoints?: readonly PrayerPoint[] | null;
  updatedAt?: IsoDateTime | null;
}
export interface PrayerSummaryView {
  id: EntityId;
  title: string;
  theme?: string;
  category?: PrayerCategory;
  categoryLabel: string;
  status: PrayerStatus;
  statusLabel: string;
  scriptureLabel?: string;
  prayerPointCount?: number;
  versionLabel?: string;
  updatedAt?: Date;
  updatedLabel: string;
}
export interface PrayerTimelineEvent {
  id: EntityId;
  label: string;
  detail?: string;
  actorName?: string;
  occurredAt: IsoDateTime;
}
export interface PrayerVersion {
  id: EntityId;
  number: number;
  status: PrayerStatus;
  reviewStatus: string;
  createdAt: IsoDateTime;
  createdByName: string;
}
export interface PrayerApproval {
  status:
    "not_requested" | "pending" | "changes_requested" | "approved" | "rejected";
  versionNumber?: number;
  reviewerName?: string;
  reason?: string;
  comments?: string;
  reviewedAt?: IsoDateTime;
}
export type PrayerJob = AsyncJob<{ prayerId: EntityId; versionId: EntityId }>;

export function formatScripture(value?: ScriptureReference): string {
  return value?.book && value.chapter > 0
    ? `${value.book} ${value.chapter}${value.verses ? `:${value.verses}` : ""}`
    : "Scripture not set";
}

export const PRAYER_STATUS_LABELS: Readonly<Record<PrayerStatus, string>> = {
  draft: "Draft",
  generating: "Generating",
  version_ready: "Version ready",
  pending_approval: "Awaiting review",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  failed: "Failed",
};
export function prayerTitle(
  value: Pick<PrayerDraftForm, "title" | "theme" | "category">,
): string {
  const explicit = value.title.trim();
  if (explicit && explicit.toLowerCase() !== "untitled content")
    return explicit;
  if (value.theme.trim()) return `${value.theme.trim()} Prayers`;
  if (value.category) return `${value.category} Prayer Collection`;
  return "Prayer Collection";
}
