import type {
  AsyncJob,
  EntityId,
  IsoDateTime,
} from "../../models/domain.models";

export const DECLARATION_TYPES = [
  "Prophetic",
  "Congregational",
  "Personal",
  "Monthly",
  "Service Opening",
  "Service Closing",
  "Healing",
  "Deliverance",
  "Financial",
  "Family",
  "Leadership",
  "Revival",
  "Church Growth",
  "Missions",
  "Victory",
  "Protection",
  "Breakthrough",
  "Other",
] as const;
export const DECLARATION_TONES = [
  "Prophetic",
  "Authoritative",
  "Pastoral",
  "Covenant",
  "Declarative",
  "Warfare",
  "Encouraging",
  "Celebratory",
  "Solemn",
  "Apostolic",
] as const;
export const AUDIENCES = [
  "Entire congregation",
  "Leaders",
  "Youth",
  "Men",
  "Women",
  "Families",
  "Workers",
  "New believers",
  "Online audience",
  "Prayer team",
  "Pastors",
  "Ministry leaders",
] as const;
export const SERVICE_TYPES = [
  "Sunday Service",
  "Midweek Service",
  "Prayer Meeting",
  "All-Night Service",
  "Conference",
  "Revival",
  "Leadership Meeting",
  "Youth Service",
  "Special Event",
  "Online Service",
] as const;
export const VARIANT_LABELS = {
  full: "Full Declaration",
  congregational: "Congregational",
  personal: "Personal",
  social: "Short Social",
  flyer: "Flyer",
  voiceover: "Video Voice-over",
} as const;
export type DeclarationType = (typeof DECLARATION_TYPES)[number];
export type DeclarationTone = (typeof DECLARATION_TONES)[number];
export type AudienceType = (typeof AUDIENCES)[number];
export type ServiceType = (typeof SERVICE_TYPES)[number];
export type DeclarationStatus =
  | "draft"
  | "generating"
  | "version_ready"
  | "awaiting_approval"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected";
export type VariantKind = keyof typeof VARIANT_LABELS;
export interface ScriptureReference {
  reference: string;
}
export interface ServiceContext {
  serviceType?: ServiceType;
  event?: string;
  occasion?: string;
  date?: string | null;
  notes?: string;
}
export interface DeclarationAdvancedOptions {
  length: "short" | "standard" | "extended";
  includeScriptureQuotations: boolean;
  includeCongregationalResponse: boolean;
  includeAmenResponse: boolean;
  includeSocialVersion: boolean;
  includeFlyerVersion: boolean;
  includeVideoVoiceoverVersion: boolean;
  includePersonalVersion: boolean;
  includeCongregationalVersion: boolean;
}
export interface DeclarationDraftForm {
  title: string;
  declarationType: DeclarationType;
  primaryScripture: ScriptureReference;
  supportingScriptures: ScriptureReference[];
  tone: DeclarationTone;
  audience: AudienceType[];
  serviceContext: ServiceContext;
  objective: string;
  advancedOptions: DeclarationAdvancedOptions;
}
export interface DeclarationVariant {
  id: EntityId;
  kind: VariantKind;
  content: string;
  updatedAt?: IsoDateTime;
}
export interface DeclarationRecord {
  id: EntityId;
  revision: number;
  currentVersionId?: EntityId;
  title?: string;
  status: DeclarationStatus;
  brief: DeclarationDraftForm;
  variants: readonly DeclarationVariant[];
  closingResponse?: string;
  updatedAt: IsoDateTime;
}
export interface DeclarationSummary {
  id: EntityId;
  revision: number;
  title?: string;
  status: DeclarationStatus;
  declarationType?: DeclarationType;
  primaryScripture?: ScriptureReference;
  audience?: AudienceType[];
  objective?: string;
  serviceType?: ServiceType;
  updatedAt: IsoDateTime;
}
export interface DeclarationTimelineEvent {
  id: EntityId;
  label: string;
  detail?: string;
  actorName?: string;
  occurredAt: IsoDateTime;
}
export interface DeclarationVersion {
  id: EntityId;
  number: number;
  createdAt: IsoDateTime;
  createdByName: string;
  changeSummary?: string;
  approvalStatus: string;
  changes?: readonly string[];
}
export interface DeclarationApproval {
  status:
    | "not_requested"
    | "awaiting_approval"
    | "in_review"
    | "changes_requested"
    | "approved"
    | "rejected";
  versionNumber?: number;
  reviewerName?: string;
  reason?: string;
  comments?: string;
  reviewedAt?: IsoDateTime;
}
export type DeclarationJob = AsyncJob<{
  declarationId: EntityId;
  versionId: EntityId;
}>;
export type RefineAction =
  | "more_prophetic"
  | "more_scriptural"
  | "more_concise"
  | "stronger"
  | "more_pastoral"
  | "covenant_language"
  | "congregational_response"
  | "social_version"
  | "flyer_version"
  | "voiceover_version";
export function declarationTitle(
  item: Partial<DeclarationSummary & { brief: DeclarationDraftForm }>,
): string {
  const brief = item.brief;
  const explicit = (item.title || brief?.title || "").trim();
  if (explicit && explicit.toLowerCase() !== "untitled content")
    return explicit;
  const objective = (item.objective || brief?.objective || "").trim();
  if (objective) return `${objective.replace(/[.!?]$/, "")} Declaration`;
  const type = item.declarationType || brief?.declarationType;
  if (type) return `${type} Declaration`;
  const service = item.serviceType || brief?.serviceContext.serviceType;
  return service ? `${service} Declaration` : "Prophetic Declaration";
}
export function statusLabel(status: DeclarationStatus): string {
  return status
    .split("_")
    .map((v) => v[0].toUpperCase() + v.slice(1))
    .join(" ");
}
