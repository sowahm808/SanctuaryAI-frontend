import type {
  DashboardAiUsage,
  DashboardCampaign,
  DashboardChannelHealth,
  DashboardMetric,
  DashboardPublishingFailure,
  DashboardQuickAction,
  DashboardRecentContent,
  DashboardScheduledPost,
  DashboardSectionIssue,
  DashboardSummary,
  DashboardWorkItem,
} from "./dashboard.models";
import type { EntityId, IsoDateTime } from "../../models/domain.models";

type RecordInput = Record<string, unknown>;

export function normalizeDashboardSummary(summary: unknown): DashboardSummary {
  const input = readRecord(summary) ?? {};
  const currentCampaign = readRecord(
    input["currentCampaign"] ??
      input["current_campaign"] ??
      input["activeCampaign"] ??
      input["active_campaign"],
  );

  return {
    generatedAt: readIsoDateTime(input["generatedAt"] ?? input["generated_at"]),
    stale: readBoolean(input["stale"]),
    staleReason: readOptionalString(
      input["staleReason"] ?? input["stale_reason"],
    ),
    metrics: asArray(input["metrics"]).map(normalizeMetric),
    currentCampaign: currentCampaign
      ? normalizeCampaign(currentCampaign)
      : undefined,
    workItems: asArray(input["workItems"] ?? input["work_items"])
      .map(normalizeWorkItem)
      .filter((item) => isInternalAppHref(item.href)),
    scheduledPosts: asArray(input["scheduledPosts"] ?? input["scheduled_posts"])
      .map(normalizeScheduledPost)
      .filter((post) => isInternalAppHref(post.href)),
    publishingFailures: asArray(
      input["publishingFailures"] ?? input["publishing_failures"],
    )
      .map(normalizePublishingFailure)
      .filter((failure) => isInternalAppHref(failure.retryHref)),
    channels: asArray(input["channels"])
      .map(normalizeChannel)
      .filter(
        (channel) =>
          channel.reconnectHref === undefined ||
          isInternalAppHref(channel.reconnectHref),
      ),
    recentContent: asArray(input["recentContent"] ?? input["recent_content"])
      .map(normalizeRecentContent)
      .filter((content) => isInternalAppHref(content.href)),
    aiUsage: readRecord(input["aiUsage"] ?? input["ai_usage"])
      ? normalizeAiUsage(readRecord(input["aiUsage"] ?? input["ai_usage"])!)
      : undefined,
    quickActions: asArray(input["quickActions"] ?? input["quick_actions"])
      .map(normalizeQuickAction)
      .filter((action) => isInternalAppHref(action.href)),
    sectionIssues: asArray(
      input["sectionIssues"] ?? input["section_issues"],
    ).map(normalizeSectionIssue),
  };
}

function normalizeMetric(metric: RecordInput): DashboardMetric {
  return {
    kind: readString(metric["kind"]) as DashboardMetric["kind"],
    label: readString(metric["label"]),
    value: clampCount(metric["value"]),
    context: readString(metric["context"]),
    severity: readString(
      metric["severity"],
      "neutral",
    ) as DashboardMetric["severity"],
  };
}

function normalizeCampaign(campaign: RecordInput): DashboardCampaign {
  return {
    id: readEntityId(campaign["id"]),
    title: readString(campaign["title"]),
    monthLabel: readString(campaign["monthLabel"] ?? campaign["month_label"]),
    scriptureReference: readOptionalString(
      campaign["scriptureReference"] ?? campaign["scripture_reference"],
    ),
    approvedAssets: clampCount(
      campaign["approvedAssets"] ?? campaign["approved_assets"],
    ),
    totalAssets: clampCount(
      campaign["totalAssets"] ?? campaign["total_assets"],
    ),
    nextServiceAt: readOptionalIsoDateTime(
      campaign["nextServiceAt"] ?? campaign["next_service_at"],
    ),
    reviewCount: clampCount(
      campaign["reviewCount"] ?? campaign["review_count"],
    ),
  };
}

function normalizeWorkItem(item: RecordInput): DashboardWorkItem {
  return {
    id: readEntityId(item["id"]),
    title: readString(item["title"]),
    type: readString(item["type"]) as DashboardWorkItem["type"],
    category: readString(
      item["category"],
      "draft-sermon",
    ) as DashboardWorkItem["category"],
    status: readString(item["status"]),
    detail: readString(item["detail"]),
    href: readString(item["href"]),
    updatedAt: readIsoDateTime(item["updatedAt"] ?? item["updated_at"]),
    dueAt: readOptionalIsoDateTime(item["dueAt"] ?? item["due_at"]),
  };
}

function normalizeScheduledPost(post: RecordInput): DashboardScheduledPost {
  return {
    id: readEntityId(post["id"]),
    title: readString(post["title"]),
    provider: readString(
      post["provider"],
    ) as DashboardScheduledPost["provider"],
    scheduledFor: readIsoDateTime(
      post["scheduledFor"] ?? post["scheduled_for"],
    ),
    href: readString(post["href"]),
  };
}

function normalizePublishingFailure(
  failure: RecordInput,
): DashboardPublishingFailure {
  return {
    id: readEntityId(failure["id"]),
    title: readString(failure["title"]),
    provider: readString(
      failure["provider"],
    ) as DashboardPublishingFailure["provider"],
    failedAt: readIsoDateTime(failure["failedAt"] ?? failure["failed_at"]),
    reason: readString(failure["reason"]),
    retryHref: readString(failure["retryHref"] ?? failure["retry_href"]),
  };
}

function normalizeChannel(channel: RecordInput): DashboardChannelHealth {
  return {
    id: readEntityId(channel["id"]),
    provider: readString(
      channel["provider"],
    ) as DashboardChannelHealth["provider"],
    displayName: readString(channel["displayName"] ?? channel["display_name"]),
    status: readString(
      channel["status"],
      "warning",
    ) as DashboardChannelHealth["status"],
    statusLabel: readString(channel["statusLabel"] ?? channel["status_label"]),
    reconnectHref: readOptionalString(
      channel["reconnectHref"] ?? channel["reconnect_href"],
    ),
    observedAt: readOptionalIsoDateTime(
      channel["observedAt"] ?? channel["observed_at"],
    ),
  };
}

function normalizeRecentContent(content: RecordInput): DashboardRecentContent {
  return {
    id: readEntityId(content["id"]),
    title: readString(content["title"]),
    kind: readString(content["kind"]) as DashboardRecentContent["kind"],
    contextLabel: readString(
      content["contextLabel"] ?? content["context_label"],
    ),
    occurredAt: readIsoDateTime(
      content["occurredAt"] ?? content["occurred_at"],
    ),
    href: readString(content["href"]),
  };
}

function normalizeAiUsage(usage: RecordInput): DashboardAiUsage {
  return {
    periodLabel: readString(usage["periodLabel"] ?? usage["period_label"]),
    generationsUsed: clampCount(
      usage["generationsUsed"] ?? usage["generations_used"],
    ),
    generationLimit: clampCount(
      usage["generationLimit"] ?? usage["generation_limit"],
    ),
    resetAt: readOptionalIsoDateTime(usage["resetAt"] ?? usage["reset_at"]),
    contextLabel: readString(usage["contextLabel"] ?? usage["context_label"]),
  };
}

function normalizeQuickAction(action: RecordInput): DashboardQuickAction {
  return {
    label: readString(action["label"]),
    href: readString(action["href"]),
    icon: readString(action["icon"]),
    permission: readString(
      action["permission"],
    ) as DashboardQuickAction["permission"],
  };
}

function normalizeSectionIssue(issue: RecordInput): DashboardSectionIssue {
  return {
    section: readString(issue["section"]) as DashboardSectionIssue["section"],
    message: readString(issue["message"]),
    retryable: readBoolean(issue["retryable"]),
  };
}

function asArray(value: unknown): readonly RecordInput[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function readRecord(value: unknown): RecordInput | undefined {
  return isRecord(value) ? value : undefined;
}

function isRecord(value: unknown): value is RecordInput {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEntityId(value: unknown): EntityId {
  return readString(value) as EntityId;
}

function readIsoDateTime(value: unknown): IsoDateTime {
  return readString(value) as IsoDateTime;
}

function readOptionalIsoDateTime(value: unknown): IsoDateTime | undefined {
  return readOptionalString(value) as IsoDateTime | undefined;
}

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function clampCount(value: unknown): number {
  const numeric = typeof value === "string" ? Number(value) : value;

  return typeof numeric === "number" && Number.isFinite(numeric)
    ? Math.max(0, numeric)
    : 0;
}

function isInternalAppHref(href: string): boolean {
  return href.startsWith("/app/") && !href.startsWith("//");
}
