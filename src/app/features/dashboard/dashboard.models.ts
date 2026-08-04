import type { EntityId, IsoDateTime } from "../../models/domain.models";

export type DashboardAttentionKind =
  "review" | "schedule" | "publishing-failure" | "account-health";

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

export interface DashboardWorkItem {
  id: EntityId;
  title: string;
  type: "sermon" | "prayer" | "declaration" | "flyer" | "video" | "social-post";
  status: string;
  detail: string;
  href: string;
  updatedAt: IsoDateTime;
}

export interface DashboardChannelHealth {
  id: EntityId;
  provider: "facebook" | "instagram" | "tiktok";
  displayName: string;
  status: "healthy" | "warning" | "disconnected";
  statusLabel: string;
  reconnectHref?: string;
}

export interface DashboardSummary {
  generatedAt: IsoDateTime;
  metrics: readonly DashboardMetric[];
  currentCampaign?: DashboardCampaign;
  workItems: readonly DashboardWorkItem[];
  channels: readonly DashboardChannelHealth[];
}
