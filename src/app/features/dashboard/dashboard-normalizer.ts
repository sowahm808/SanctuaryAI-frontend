import type { DashboardSummary } from "./dashboard.models";

export function normalizeDashboardSummary(
  summary: DashboardSummary,
): DashboardSummary {
  return {
    ...summary,
    stale: summary.stale ?? false,
    metrics: asArray(summary.metrics).map((metric) => ({
      ...metric,
      value: clampCount(metric.value),
    })),
    currentCampaign: summary.currentCampaign
      ? {
          ...summary.currentCampaign,
          approvedAssets: clampCount(summary.currentCampaign.approvedAssets),
          totalAssets: clampCount(summary.currentCampaign.totalAssets),
          reviewCount: clampCount(summary.currentCampaign.reviewCount),
        }
      : undefined,
    workItems: asArray(summary.workItems).filter((item) =>
      isInternalAppHref(item.href),
    ),
    scheduledPosts: asArray(summary.scheduledPosts).filter((post) =>
      isInternalAppHref(post.href),
    ),
    publishingFailures: asArray(summary.publishingFailures).filter((failure) =>
      isInternalAppHref(failure.retryHref),
    ),
    channels: asArray(summary.channels).filter(
      (channel) =>
        channel.reconnectHref === undefined ||
        isInternalAppHref(channel.reconnectHref),
    ),
    recentContent: asArray(summary.recentContent).filter((content) =>
      isInternalAppHref(content.href),
    ),
    quickActions: asArray(summary.quickActions).filter((action) =>
      isInternalAppHref(action.href),
    ),
    sectionIssues: asArray(summary.sectionIssues),
  };
}

function asArray<T>(value: readonly T[] | undefined): readonly T[] {
  return Array.isArray(value) ? value : [];
}

function clampCount(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function isInternalAppHref(href: string): boolean {
  return href.startsWith("/app/") && !href.startsWith("//");
}
