import { describe, expect, it } from "vitest";
import { normalizeDashboardSummary } from "./dashboard-normalizer";
import type { DashboardSummary } from "./dashboard.models";

const base: DashboardSummary = {
  generatedAt: "2026-08-04T12:00:00Z",
  stale: false,
  metrics: [
    {
      kind: "review",
      label: "Awaiting review",
      value: -3,
      context: "2 due today",
      severity: "warning",
    },
  ],
  workItems: [],
  scheduledPosts: [],
  publishingFailures: [],
  channels: [],
  recentContent: [],
  quickActions: [],
  sectionIssues: [],
};

describe("normalizeDashboardSummary", () => {
  it("keeps additive dashboard arrays safe when older API responses omit them", () => {
    const legacy = {
      generatedAt: base.generatedAt,
      metrics: base.metrics,
      workItems: base.workItems,
      channels: base.channels,
    } as Partial<DashboardSummary> as DashboardSummary;

    expect(normalizeDashboardSummary(legacy)).toMatchObject({
      stale: false,
      scheduledPosts: [],
      publishingFailures: [],
      recentContent: [],
      quickActions: [],
      sectionIssues: [],
    });
  });

  it("clamps negative counts before display", () => {
    const summary = normalizeDashboardSummary({
      ...base,
      currentCampaign: {
        id: "cmp_1",
        title: "August",
        monthLabel: "August 2026",
        approvedAssets: -2,
        totalAssets: -1,
        reviewCount: -4,
      },
    });

    expect(summary.metrics[0]?.value).toBe(0);
    expect(summary.currentCampaign?.approvedAssets).toBe(0);
    expect(summary.currentCampaign?.totalAssets).toBe(0);
    expect(summary.currentCampaign?.reviewCount).toBe(0);
  });

  it("accepts production dashboard aliases and numeric strings", () => {
    const summary = normalizeDashboardSummary({
      generated_at: base.generatedAt,
      stale: false,
      metrics: [
        {
          kind: "review",
          label: "Awaiting review",
          value: "7",
          context: "3 due today",
          severity: "warning",
        },
      ],
      active_campaign: {
        id: "cmp_2",
        title: "Kingdom Authority",
        month_label: "August 2026",
        scripture_reference: "Luke 10:19",
        approved_assets: "8",
        total_assets: "12",
        next_service_at: "2026-08-09T09:00:00Z",
        review_count: "3",
      },
      work_items: [
        {
          id: "ser_2",
          title: "Authority of the Believer",
          type: "sermon",
          category: "draft-sermon",
          status: "Draft",
          detail: "Autosaved remotely",
          href: "/app/sermons/ser_2",
          updated_at: base.generatedAt,
        },
      ],
      scheduled_posts: [],
      publishing_failures: [],
      channels: [],
      recent_content: [],
      quick_actions: [],
      section_issues: [],
    });

    expect(summary.metrics[0]?.value).toBe(7);
    expect(summary.currentCampaign).toMatchObject({
      id: "cmp_2",
      monthLabel: "August 2026",
      approvedAssets: 8,
      totalAssets: 12,
      reviewCount: 3,
    });
    expect(summary.workItems[0]?.updatedAt).toBe(base.generatedAt);
  });

  it("drops external dashboard links returned by mistake", () => {
    const summary = normalizeDashboardSummary({
      ...base,
      workItems: [
        {
          id: "safe",
          title: "Safe",
          type: "sermon",
          category: "draft-sermon",
          status: "Draft",
          detail: "Server draft",
          href: "/app/sermons/safe",
          updatedAt: base.generatedAt,
        },
        {
          id: "unsafe",
          title: "Unsafe",
          type: "sermon",
          category: "draft-sermon",
          status: "Draft",
          detail: "External",
          href: "https://example.com/phish",
          updatedAt: base.generatedAt,
        },
      ],
      publishingFailures: [
        {
          id: "failure",
          title: "Failure",
          provider: "facebook",
          failedAt: base.generatedAt,
          reason: "Provider error",
          retryHref: "//evil.example/retry",
        },
      ],
    });

    expect(summary.workItems.map((item) => item.id)).toEqual(["safe"]);
    expect(summary.publishingFailures).toEqual([]);
  });
});
