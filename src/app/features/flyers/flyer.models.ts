export type RevisionToken = string;
export type FlyerWorkflowStatus =
  | "draft"
  | "generating"
  | "rendering"
  | "version_ready"
  | "pending_approval"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "failed";
export type FlyerRenderStatus =
  "not_rendered" | "queued" | "rendering" | "ready" | "failed";
export type FlyerType =
  | "monthly_theme"
  | "sunday_service"
  | "conference"
  | "prayer_meeting"
  | "all_night_service"
  | "sermon_quote"
  | "prophetic_declaration"
  | "youth_event"
  | "giving"
  | "revival"
  | "holiday"
  | "announcement"
  | "social_promotion"
  | "special_event";
export type FlyerSize =
  | "1080x1080"
  | "1080x1350"
  | "1080x1920"
  | "1200x630"
  | "1920x1080"
  | "A4"
  | "Letter"
  | "Custom";
export type LinkedResourceType =
  | "campaign"
  | "monthly_theme"
  | "sermon"
  | "prayer_collection"
  | "prophetic_declaration"
  | "calendar_event";

export interface FlyerBrief {
  title: string;
  subtitle: string;
  flyerType: FlyerType;
  campaignId: string;
  linkedResourceType: LinkedResourceType | "";
  linkedResourceId: string;
  primaryScripture: string;
  supportingScriptures: string[];
  eventDate: string;
  eventTime: string;
  venue: string;
  speaker: string;
  cta: string;
  audience: string;
  website: string;
  contact: string;
  notes: string;
}
export interface FlyerProjectView extends FlyerBrief {
  id: string;
  revisionToken: RevisionToken;
  versionNumber?: number;
  status: FlyerWorkflowStatus;
  renderStatus: FlyerRenderStatus;
  templateId?: string;
  assetIds: string[];
  selectedSize: FlyerSize;
  customWidth?: number;
  customHeight?: number;
  canvasJson?: unknown;
  updatedAt?: Date;
}
export interface FlyerVariantView {
  id: string;
  name: string;
  width: number;
  height: number;
  assetId?: string;
  previewUrl?: string;
  downloadUrl?: string;
  renderStatus: FlyerRenderStatus;
  format?: string;
  fileSize?: number;
  versionNumber?: number;
  approved?: boolean;
  updatedAt?: Date;
}
export interface FlyerSummaryView {
  id: string;
  title: string;
  flyerType: FlyerType;
  linkedTitle?: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  status: FlyerWorkflowStatus;
  renderStatus: FlyerRenderStatus;
  versionNumber?: number;
  updatedAt?: Date;
}
export interface FlyerVersionView {
  id: string;
  versionNumber: number;
  thumbnailUrl?: string;
  createdAt?: Date;
  createdBy?: string;
  changeSummary?: string;
  renderStatus: FlyerRenderStatus;
  approvalStatus?: string;
}
export interface FlyerTimelineView {
  id: string;
  type: string;
  label: string;
  createdAt?: Date;
  actorName?: string;
}
export interface FlyerApprovalView {
  id: string;
  versionId: string;
  versionNumber?: number;
  status:
    | "awaiting_approval"
    | "in_review"
    | "changes_requested"
    | "approved"
    | "rejected";
  comments: string[];
}
export interface MediaAssetView {
  id: string;
  name: string;
  kind: "logo" | "speaker" | "background" | "event" | "image";
  url: string;
  thumbnailUrl?: string;
}
export interface BrandKitView {
  primaryColors: string[];
  secondaryColors: string[];
  fontFamilies: string[];
  churchName: string;
  website: string;
  socialHandles: string[];
  logo?: MediaAssetView;
}
export interface FlyerTemplateView {
  id: string;
  flyerType: FlyerType;
  name: string;
  tags: string[];
  palette: string[];
  thumbnailAssetId?: string;
  supportedSizes: FlyerSize[];
  category: string;
  description: string;
  brandCompatible: boolean;
  previewUrl?: string;
}
export interface AsyncJobView {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
}
export interface RecoverySnapshot {
  flyerId: string;
  lastKnownServerRevision: string;
  savedAt: string;
  canvasJson: unknown;
  unsavedFormState: FlyerBrief;
}

export const FLYER_TYPES: readonly { value: FlyerType; label: string }[] = [
  ["monthly_theme", "Monthly Theme"],
  ["sunday_service", "Sunday Service"],
  ["conference", "Conference"],
  ["prayer_meeting", "Prayer Meeting"],
  ["all_night_service", "All-Night Service"],
  ["sermon_quote", "Sermon Quote"],
  ["prophetic_declaration", "Prophetic Declaration"],
  ["youth_event", "Youth Event"],
  ["giving", "Giving"],
  ["revival", "Revival"],
  ["holiday", "Holiday"],
  ["announcement", "Announcement"],
  ["social_promotion", "Social Promotion"],
  ["special_event", "Special Event"],
].map(([value, label]) => ({ value: value as FlyerType, label }));
export const FLYER_SIZES: readonly FlyerSize[] = [
  "1080x1080",
  "1080x1350",
  "1080x1920",
  "1200x630",
  "1920x1080",
  "A4",
  "Letter",
  "Custom",
];
export const emptyBrief = (): FlyerBrief => ({
  title: "",
  subtitle: "",
  flyerType: "announcement",
  campaignId: "",
  linkedResourceType: "",
  linkedResourceId: "",
  primaryScripture: "",
  supportingScriptures: [],
  eventDate: "",
  eventTime: "",
  venue: "",
  speaker: "",
  cta: "",
  audience: "",
  website: "",
  contact: "",
  notes: "",
});
