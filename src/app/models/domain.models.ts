export type Brand<T, Name extends string> = T & { readonly __brand: Name };
export type EntityId = Brand<string, "EntityId">;
export type IsoDateTime = Brand<string, "IsoDateTime">;

export interface AuditMetadata {
  createdAt: IsoDateTime;
  createdBy: EntityId;
  updatedAt: IsoDateTime;
  updatedBy: EntityId;
}
export interface OrganizationScoped {
  organizationId: EntityId;
}

export type Permission =
  | "themes.create"
  | "themes.read"
  | "themes.update"
  | "themes.approve"
  | "sermons.create"
  | "sermons.publish"
  | "flyers.edit"
  | "social.schedule"
  | "social.publish"
  | "users.manage"
  | "settings.manage";
export type Role =
  | "SuperAdministrator"
  | "ChurchAdministrator"
  | "SeniorPastor"
  | "AssociatePastor"
  | "ContentWriter"
  | "MediaTeam"
  | "Reviewer"
  | "Publisher"
  | "Viewer";
export interface UserClaims {
  name: string;
  email?: string;
  picture?: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  claims?: UserClaims;
  permissions: ReadonlySet<Permission>;
}

export interface ChurchProfile {
  id: EntityId;
  name: string;
  slogan?: string;
  description?: string;
  seniorPastor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  bibleTranslation?: string;
  onboardingStatus?: "not_started" | "in_progress" | "complete";
}
export interface CreateChurchProfileRequest {
  setupMode: string;
  invitationCode?: string;
  name: string;
  slogan?: string;
  description?: string;
  seniorPastor?: string;
  primaryColor?: string;
  secondaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  primaryLogo?: string;
  secondaryLogo?: string;
  primaryLogoAlt?: string;
  secondaryLogoAlt?: string;
  logoCropInstructions?: string;
  physicalAddress?: string;
  digitalAddress?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialChannels?: string;
  serviceDays?: string;
  serviceTimes?: string;
  bibleTranslation?: string;
  ministryTone?: string;
  statementOfFaith?: string;
  doctrinalGuidelines?: string;
  prohibitedContent?: string;
  hashtags?: string;
  defaultFooter?: string;
  teamInvitations?: string;
  socialConnectionNotes?: string;
  firstCampaignChoice: string;
}
export interface Membership extends OrganizationScoped {
  id: EntityId;
  userId: EntityId;
  role: Role;
  permissions: readonly Permission[];
  status: "invited" | "active" | "suspended";
}
export interface Subscription {
  plan: "trial" | "essential" | "ministry" | "network";
  status: "active" | "grace" | "past_due" | "cancelled";
  renewsAt?: IsoDateTime;
}

export type ContentStatus =
  | "Draft"
  | "Awaiting Approval"
  | "Approved"
  | "Scheduled"
  | "Published"
  | "Failed";
export type ApprovalStatus =
  "not_requested" | "pending" | "changes_requested" | "approved" | "rejected";
export type PublishingStatus =
  | "unscheduled"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "cancelled"
  | "manually_published";
export interface CampaignSection {
  id: string;
  title: string;
  progress: number;
  status: ContentStatus;
  locked: boolean;
}
export interface ContentRecord extends OrganizationScoped, AuditMetadata {
  id: EntityId;
  title: string;
  status: ContentStatus;
  approvalStatus: ApprovalStatus;
  publishingStatus: PublishingStatus;
  version: number;
  lockedBy?: EntityId;
  assignedTo?: EntityId;
}
export interface Comment extends OrganizationScoped, AuditMetadata {
  id: EntityId;
  contentId: EntityId;
  body: string;
  resolvedAt?: IsoDateTime;
}
export interface ContentVersion extends OrganizationScoped {
  id: EntityId;
  contentId: EntityId;
  number: number;
  snapshot: Readonly<Record<string, unknown>>;
  createdAt: IsoDateTime;
  createdBy: EntityId;
}
export interface AuditEvent extends OrganizationScoped {
  id: EntityId;
  actorId: EntityId;
  action: string;
  entityId: EntityId;
  occurredAt: IsoDateTime;
  correlationId: string;
  summary: string;
}

export interface ApiEnvelope<T> {
  data: T;
  meta: { correlationId: string; timestamp: IsoDateTime };
}
export interface ApiResponse<T> {
  data: T;
  correlationId: string;
}
export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
}
export interface ApiError {
  code: string;
  message: string;
  correlationId?: string;
  validation?: readonly ValidationIssue[];
  retryable: boolean;
}
export interface CursorPage<T> {
  items: readonly T[];
  nextCursor?: string;
  previousCursor?: string;
  total?: number;
}
export interface QueryOptions {
  cursor?: string;
  limit?: number;
  search?: string;
  sort?: string;
  direction?: "asc" | "desc";
  filters?: Readonly<Record<string, string | readonly string[]>>;
}
export type JobStatus =
  "queued" | "running" | "completed" | "failed" | "cancelled";
export interface AsyncJob<TResult = unknown> {
  id: EntityId;
  status: JobStatus;
  progress: number;
  message?: string;
  result?: TResult;
  error?: ApiError;
  retryable?: boolean;
  cancellationSupported?: boolean;
  sourceRevision?: string;
  targetFields?: readonly string[];
}
export interface UploadProgress {
  fileName: string;
  loaded: number;
  total: number;
  percentage: number;
  status: "queued" | "uploading" | "complete" | "failed" | "cancelled";
}
