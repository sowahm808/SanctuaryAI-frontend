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
