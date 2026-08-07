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
  | "rejected"
  | "failed"
  | "cancelled";

export const DECLARATION_STATUS_LABELS: Record<DeclarationStatus, string> = {
  draft: "Draft",
  generating: "Generating",
  version_ready: "Version ready",
  awaiting_approval: "Awaiting approval",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  failed: "Failed",
  cancelled: "Cancelled",
};
export type VariantKind = keyof typeof VARIANT_LABELS;
/** Opaque resource concurrency token returned as `revision` by the API. */
export type RevisionToken = string;
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
export interface DeclarationViewModel {
  id: EntityId;
  revisionToken: RevisionToken;
  versionNumber?: number;
  currentVersionId?: EntityId;
  title?: string;
  status: DeclarationStatus;
  brief: DeclarationDraftForm;
  variants: readonly DeclarationVariant[];
  closingResponse?: string;
  updatedAt: IsoDateTime;
}
export type DeclarationRecord = DeclarationViewModel;
/** Untrusted transport shape, including records created by the generic workflow. */
export interface DeclarationDto {
  id?: unknown;
  revision: RevisionToken;
  versionNumber?: number;
  currentVersionId?: unknown;
  title?: unknown;
  status?: unknown;
  brief?: unknown;
  variants?: unknown;
  closingResponse?: unknown;
  updatedAt?: unknown;
}
export interface DeclarationSummary {
  id: EntityId;
  revision: number | null;
  revisionLabel: string | null;
  title: string;
  status: DeclarationStatus;
  statusLabel: string;
  declarationType?: DeclarationType;
  declarationTypeLabel: string | null;
  primaryScripture?: ScriptureReference;
  audience?: AudienceType[];
  objective?: string;
  serviceType?: ServiceType;
  updatedAt: IsoDateTime | null;
}

/** Transport shape includes nullable fields emitted by pre-Studio workflow records. */
export interface DeclarationSummaryDto {
  id?: unknown;
  revision?: unknown;
  title?: unknown;
  status?: unknown;
  declarationType?: unknown;
  primaryScripture?: unknown;
  audience?: unknown;
  objective?: unknown;
  serviceType?: unknown;
  serviceContext?: unknown;
  brief?: unknown;
  updatedAt?: unknown;
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
  const service = item.serviceType || brief?.serviceContext?.serviceType;
  return service ? `${service} Declaration` : "Prophetic Declaration";
}

export function normalizeDeclarationStatus(value: unknown): DeclarationStatus {
  return typeof value === "string" && value in DECLARATION_STATUS_LABELS
    ? (value as DeclarationStatus)
    : "draft";
}

export function statusLabel(value: unknown): string {
  return DECLARATION_STATUS_LABELS[normalizeDeclarationStatus(value)];
}

export function toDeclarationSummaryView(
  dto: DeclarationSummaryDto,
): DeclarationSummary | null {
  if (typeof dto?.id !== "string" || !dto.id.trim()) return null;
  const brief = record(dto.brief);
  const serviceContext =
    record(dto.serviceContext) ?? record(brief?.["serviceContext"]);
  const status = normalizeDeclarationStatus(dto.status);
  const revision = numericRevision(dto.revision);
  const declarationType = controlled(
    dto.declarationType ?? brief?.["declarationType"],
    DECLARATION_TYPES,
  );
  const objective = text(dto.objective ?? brief?.["objective"]);
  const serviceType = controlled(
    dto.serviceType ?? serviceContext?.["serviceType"],
    SERVICE_TYPES,
  );
  const title = declarationTitle({
    title: text(dto.title ?? brief?.["title"]),
    objective,
    declarationType,
    serviceType,
  });
  return {
    id: dto.id as EntityId,
    title,
    status,
    statusLabel: DECLARATION_STATUS_LABELS[status],
    revision,
    revisionLabel: revision === null ? null : `v${revision}`,
    declarationType,
    declarationTypeLabel: declarationType ?? null,
    primaryScripture: scripture(
      dto.primaryScripture ?? brief?.["primaryScripture"],
    ),
    audience: controlledArray(dto.audience ?? brief?.["audience"], AUDIENCES),
    objective,
    serviceType,
    updatedAt: isoDate(dto.updatedAt),
  };
}

/** Restricts values used by Angular collection bindings to genuine arrays. */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Maps both Studio and legacy generic-workflow records to an iterable-safe view. */
export function toDeclarationView(dto: DeclarationDto): DeclarationRecord {
  const brief = record(dto.brief) ?? {};
  const primaryScripture = toScripture(
    brief["primaryScripture"] ?? brief["scripture"],
  );
  return {
    id: (text(dto.id) ?? "") as EntityId,
    revisionToken: dto.revision,
    versionNumber: numericRevision(dto.versionNumber) ?? undefined,
    currentVersionId: text(dto.currentVersionId) as EntityId | undefined,
    title: text(dto.title ?? brief["title"]),
    status: normalizeDeclarationStatus(dto.status),
    brief: {
      title: text(brief["title"] ?? dto.title) ?? "",
      declarationType:
        controlled(brief["declarationType"], DECLARATION_TYPES) ?? "Prophetic",
      primaryScripture: primaryScripture ?? { reference: "" },
      supportingScriptures: scriptureArray(brief["supportingScriptures"]),
      tone: controlled(brief["tone"], DECLARATION_TONES) ?? "Prophetic",
      audience: controlledStringArray(brief["audience"], AUDIENCES),
      serviceContext: serviceContextView(brief["serviceContext"]),
      objective: text(brief["objective"]) ?? "",
      advancedOptions: advancedOptionsView(brief["advancedOptions"]),
    },
    variants: variantArray(dto.variants ?? brief["variants"]),
    closingResponse: text(dto.closingResponse),
    updatedAt: (isoDate(dto.updatedAt) ?? "") as IsoDateTime,
  };
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}
function controlled<T extends string>(
  value: unknown,
  options: readonly T[],
): T | undefined {
  return typeof value === "string" && options.includes(value as T)
    ? (value as T)
    : undefined;
}
function controlledArray<T extends string>(
  value: unknown,
  options: readonly T[],
): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter(
    (item): item is T => controlled(item, options) !== undefined,
  );
  return values.length ? values : undefined;
}
function controlledStringArray<T extends string>(
  value: unknown,
  options: readonly T[],
): T[] {
  const source = typeof value === "string" ? [value] : asArray<unknown>(value);
  return source.filter(
    (item): item is T => controlled(item, options) !== undefined,
  );
}
function numericRevision(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0
    ? value
    : null;
}
function isoDate(value: unknown): IsoDateTime | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return Number.isNaN(Date.parse(value)) ? null : (value as IsoDateTime);
}
function scripture(value: unknown): ScriptureReference | undefined {
  const reference = text(record(value)?.["reference"]);
  return reference ? { reference } : undefined;
}

function toScripture(value: unknown): ScriptureReference | undefined {
  if (typeof value === "string") {
    const reference = text(value);
    return reference ? { reference } : undefined;
  }
  return scripture(value);
}

function scriptureArray(value: unknown): ScriptureReference[] {
  const source = typeof value === "string" ? [value] : asArray<unknown>(value);
  return source.flatMap((item) => {
    const mapped = toScripture(item);
    return mapped ? [mapped] : [];
  });
}

function variantArray(value: unknown): DeclarationVariant[] {
  const source = Array.isArray(value)
    ? value.map((item) => ({ key: undefined, value: item }))
    : Object.entries(record(value) ?? {}).map(([key, item]) => ({
        key,
        value: item,
      }));
  return source.flatMap(({ key, value }, index) => {
    const item = record(value);
    const kind = controlled(
      item?.["kind"] ?? key,
      Object.keys(VARIANT_LABELS) as VariantKind[],
    );
    const content = text(item?.["content"] ?? value);
    if (!kind || !content) return [];
    return [
      {
        id: (text(item?.["id"]) ?? `${kind}-${index}`) as EntityId,
        kind,
        content,
        updatedAt: isoDate(item?.["updatedAt"]) ?? undefined,
      },
    ];
  });
}

function serviceContextView(value: unknown): ServiceContext {
  const source = record(value) ?? {};
  return {
    serviceType: controlled(source["serviceType"], SERVICE_TYPES),
    event: text(source["event"]),
    occasion: text(source["occasion"]),
    date: isoDate(source["date"]),
    notes: text(source["notes"]),
  };
}

function advancedOptionsView(value: unknown): DeclarationAdvancedOptions {
  const source = record(value) ?? {};
  const flag = (key: string, fallback: boolean) =>
    typeof source[key] === "boolean" ? (source[key] as boolean) : fallback;
  return {
    length:
      controlled(source["length"], [
        "short",
        "standard",
        "extended",
      ] as const) ?? "standard",
    includeScriptureQuotations: flag("includeScriptureQuotations", true),
    includeCongregationalResponse: flag("includeCongregationalResponse", true),
    includeAmenResponse: flag("includeAmenResponse", true),
    includeSocialVersion: flag("includeSocialVersion", false),
    includeFlyerVersion: flag("includeFlyerVersion", false),
    includeVideoVoiceoverVersion: flag("includeVideoVoiceoverVersion", false),
    includePersonalVersion: flag("includePersonalVersion", false),
    includeCongregationalVersion: flag("includeCongregationalVersion", true),
  };
}
