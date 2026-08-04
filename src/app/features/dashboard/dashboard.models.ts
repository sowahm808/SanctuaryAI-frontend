import type {
  EntityId,
  IsoDateTime,
  Permission,
} from "../../models/domain.models";

export type DashboardAttentionKind =
  | "review"
  | "schedule"
  | "publishing-failure"
  | "account-health"
  | "service"
  | "draft"
  | "ai-usage";

export interface DashboardMetric {
  kind: DashboardAttentionKind;
  label: string;
  value: number;
  context: string;
  severity: "neutral" | "success" | "warning" | "danger";
}
export interface DashboardCampaign {
  id: EntityId;
  title: string;
  monthLabel: string;
  scriptureReference?: string;
  approvedAssets: number;
  totalAssets: number;
  nextServiceAt?: IsoDateTime;
  reviewCount: number;
}
export type DashboardWorkCategory =
  | "upcoming-service"
  | "deadline"
  | "draft-sermon"
  | "awaiting-review"
  | "approved-awaiting-scheduling";
export interface DashboardWorkItem {
  id: EntityId;
  title: string;
  type:
    | "sermon"
    | "prayer"
    | "declaration"
    | "flyer"
    | "video"
    | "social-post"
    | "service"
    | "deadline";
  category: DashboardWorkCategory;
  status: string;
  detail: string;
  href: string;
  updatedAt: IsoDateTime;
  dueAt?: IsoDateTime;
}
export interface DashboardChannelHealth {
  id: EntityId;
  provider: "facebook" | "instagram" | "tiktok";
  displayName: string;
  status: "healthy" | "warning" | "disconnected";
  statusLabel: string;
  reconnectHref?: string;
  observedAt?: IsoDateTime;
}
export interface DashboardScheduledPost {
  id: EntityId;
  title: string;
  provider: "facebook" | "instagram" | "tiktok";
  scheduledFor: IsoDateTime;
  href: string;
}
export interface DashboardPublishingFailure {
  id: EntityId;
  title: string;
  provider: "facebook" | "instagram" | "tiktok";
  failedAt: IsoDateTime;
  reason: string;
  retryHref: string;
}
export interface DashboardRecentContent {
  id: EntityId;
  title: string;
  kind: "flyer" | "sermon";
  contextLabel: string;
  occurredAt: IsoDateTime;
  href: string;
}
export interface DashboardAiUsage {
  periodLabel: string;
  generationsUsed: number;
  generationLimit: number;
  resetAt?: IsoDateTime;
  contextLabel: string;
}
export interface DashboardQuickAction {
  label: string;
  href: string;
  icon: string;
  permission: Permission;
}
export interface DashboardSectionIssue {
  section:
    "workItems" | "publishing" | "channels" | "recentContent" | "aiUsage";
  message: string;
  retryable: boolean;
}
export interface DashboardSummary {
  generatedAt: IsoDateTime;
  stale: boolean;
  staleReason?: string;
  metrics: readonly DashboardMetric[];
  currentCampaign?: DashboardCampaign;
  workItems: readonly DashboardWorkItem[];
  scheduledPosts: readonly DashboardScheduledPost[];
  publishingFailures: readonly DashboardPublishingFailure[];
  channels: readonly DashboardChannelHealth[];
  recentContent: readonly DashboardRecentContent[];
  aiUsage?: DashboardAiUsage;
  quickActions: readonly DashboardQuickAction[];
  sectionIssues: readonly DashboardSectionIssue[];
}
