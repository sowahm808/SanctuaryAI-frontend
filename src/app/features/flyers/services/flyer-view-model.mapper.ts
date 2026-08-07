import { Injectable } from "@angular/core";
import {
  emptyBrief,
  type FlyerApprovalView,
  type FlyerProjectView,
  type FlyerSummaryView,
  type FlyerTimelineView,
  type FlyerVersionView,
  type FlyerVariantView,
} from "../flyer.models";
type AnyDto = Record<string, unknown>;
const array = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];
const text = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;
const date = (value: unknown) => (value ? new Date(String(value)) : undefined);
@Injectable({ providedIn: "root" })
export class FlyerViewModelMapper {
  project(dto: AnyDto): FlyerProjectView {
    const brief = {
      ...emptyBrief(),
      ...(dto["brief"] && typeof dto["brief"] === "object"
        ? (dto["brief"] as object)
        : dto),
    } as FlyerProjectView;
    return {
      ...brief,
      id: text(dto["id"]),
      revisionToken: text(dto["revisionToken"] ?? dto["revision"]),
      versionNumber: Number(dto["versionNumber"] ?? 0) || undefined,
      status: (dto["status"] as FlyerProjectView["status"]) || "draft",
      renderStatus:
        (dto["renderStatus"] as FlyerProjectView["renderStatus"]) ||
        "not_rendered",
      assetIds: array<string>(dto["assetIds"]),
      selectedSize:
        (dto["selectedSize"] as FlyerProjectView["selectedSize"]) ||
        "1080x1350",
      canvasJson: dto["editorJson"] ?? dto["canvasJson"],
      updatedAt: date(dto["updatedAt"]),
      supportingScriptures: array<string>(brief.supportingScriptures),
    };
  }
  summaries(envelope: unknown): FlyerSummaryView[] {
    return this.items(envelope)
      .map((d) => ({
        id: text(d["id"]),
        title: text(
          d["title"] ?? d["linkedTitle"] ?? d["flyerType"],
          "Flyer Draft",
        ),
        flyerType:
          (d["flyerType"] as FlyerSummaryView["flyerType"]) || "announcement",
        linkedTitle: text(d["linkedTitle"]) || undefined,
        thumbnailUrl: text(d["thumbnailUrl"]) || undefined,
        width: Number(d["width"] ?? 1080),
        height: Number(d["height"] ?? 1350),
        status: (d["status"] as FlyerSummaryView["status"]) || "draft",
        renderStatus:
          (d["renderStatus"] as FlyerSummaryView["renderStatus"]) ||
          "not_rendered",
        versionNumber: Number(d["versionNumber"] ?? 0) || undefined,
        updatedAt: date(d["updatedAt"]),
      }))
      .filter((x) => x.id);
  }
  variants(envelope: unknown): FlyerVariantView[] {
    return this.items(envelope) as unknown as FlyerVariantView[];
  }
  versions(envelope: unknown): FlyerVersionView[] {
    return this.items(envelope).map((d) => ({
      ...d,
      id: text(d["id"]),
      versionNumber: Number(d["versionNumber"] ?? 0),
      renderStatus:
        (d["renderStatus"] as FlyerVersionView["renderStatus"]) ||
        "not_rendered",
      createdAt: date(d["createdAt"]),
    })) as FlyerVersionView[];
  }
  timeline(envelope: unknown): FlyerTimelineView[] {
    return this.items(envelope).map((d) => ({
      ...d,
      id: text(d["id"]),
      type: text(d["type"]),
      label: text(d["label"] ?? d["type"]),
      createdAt: date(d["createdAt"]),
    })) as FlyerTimelineView[];
  }
  approval(data: unknown): FlyerApprovalView | null {
    if (!data || typeof data !== "object") return null;
    const d = data as AnyDto;
    return {
      ...(d as unknown as FlyerApprovalView),
      id: text(d["id"]),
      versionId: text(d["versionId"]),
      status:
        (d["status"] as FlyerApprovalView["status"]) || "awaiting_approval",
      comments: array<string>(d["comments"]),
    };
  }
  private items(value: unknown): AnyDto[] {
    if (Array.isArray(value)) return value as AnyDto[];
    if (!value || typeof value !== "object") return [];
    const d = value as AnyDto;
    const inner =
      d["data"] && typeof d["data"] === "object" ? (d["data"] as AnyDto) : d;
    return array<AnyDto>(inner["items"]);
  }
}
