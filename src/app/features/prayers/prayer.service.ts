import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../core/api/api-client.service";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
import type { CursorPage, EntityId } from "../../models/domain.models";
import type {
  PrayerApproval,
  PrayerDraftForm,
  PrayerDetailDto,
  PrayerJob,
  PrayerPoint,
  PrayerRecord,
  PrayerSummaryDto,
  PrayerSummaryView,
  PrayerTimelineEvent,
  PrayerVersion,
} from "./prayer.models";
import { toPrayerView } from "./prayer.models";
import { toPrayerSummaryView } from "./prayer-summary.mapper";

export const PRAYER_LIST_OPTIONS = {
  limit: 20,
  sort: "updatedAt",
  direction: "desc",
} as const;
export const prayerResource = (
  id: EntityId,
  ...segments: readonly (string | number)[]
): string => resourcePath(id, ...segments);

@Injectable({ providedIn: "root" })
export class PrayerService {
  private readonly api = inject(ApiClientService);
  list(): Observable<CursorPage<PrayerSummaryView>> {
    return this.api.list<PrayerSummaryDto>("prayers", PRAYER_LIST_OPTIONS).pipe(
      unwrapCursorPage(),
      map((page) => ({
        ...page,
        items: page.items.map((item) => toPrayerSummaryView(item)),
      })),
    );
  }
  get(id: EntityId): Observable<PrayerRecord> {
    return this.api
      .get<PrayerDetailDto>("prayers", id)
      .pipe(unwrapData(), map(toPrayerView));
  }
  create(brief: PrayerDraftForm): Observable<PrayerRecord> {
    return this.api
      .create<{ brief: PrayerDraftForm }, PrayerDetailDto>("prayers", { brief })
      .pipe(unwrapData(), map(toPrayerView));
  }
  save(
    id: EntityId,
    brief: PrayerDraftForm,
    expectedRevision: string,
  ): Observable<PrayerRecord> {
    return this.api
      .update<
        { brief: PrayerDraftForm; expectedRevision: string },
        PrayerDetailDto
      >("prayers", id, { brief, expectedRevision })
      .pipe(unwrapData(), map(toPrayerView));
  }
  generate(id: EntityId, revision: string): Observable<PrayerJob> {
    return this.api
      .postResource<{ revision: string }, PrayerJob>(
        "prayers",
        resourcePath(id, "generate"),
        { revision },
      )
      .pipe(unwrapData());
  }
  timeline(id: EntityId): Observable<readonly PrayerTimelineEvent[]> {
    return this.api
      .getResource<readonly PrayerTimelineEvent[]>(
        "prayers",
        resourcePath(id, "timeline"),
      )
      .pipe(unwrapData());
  }
  versions(id: EntityId): Observable<readonly PrayerVersion[]> {
    return this.api
      .getResource<readonly PrayerVersion[]>(
        "prayers",
        resourcePath(id, "versions"),
      )
      .pipe(unwrapData());
  }
  approval(id: EntityId): Observable<PrayerApproval> {
    return this.api
      .getResource<PrayerApproval>("prayers", resourcePath(id, "approval"))
      .pipe(unwrapData());
  }
  submitReview(id: EntityId, versionId: EntityId): Observable<PrayerRecord> {
    return this.api
      .postResource<{ versionId: EntityId }, PrayerDetailDto>(
        "prayers",
        resourcePath(id, "submit-review"),
        { versionId },
      )
      .pipe(unwrapData(), map(toPrayerView));
  }
  createRevision(id: EntityId): Observable<PrayerRecord> {
    return this.api
      .postResource<Record<string, never>, PrayerDetailDto>(
        "prayers",
        resourcePath(id, "revisions"),
        {},
      )
      .pipe(unwrapData(), map(toPrayerView));
  }
  updatePoint(id: EntityId, point: PrayerPoint): Observable<PrayerRecord> {
    return this.api
      .patchResource<PrayerPoint, PrayerDetailDto>(
        "prayers",
        resourcePath(id, "points", point.id),
        point,
      )
      .pipe(unwrapData(), map(toPrayerView));
  }
  pointAction(
    id: EntityId,
    pointId: EntityId,
    action: "duplicate" | "delete" | "regenerate",
  ): Observable<PrayerRecord | PrayerJob> {
    return this.api
      .postResource<{ action: string }, PrayerRecord | PrayerJob>(
        "prayers",
        resourcePath(id, "points", pointId, "actions"),
        { action },
      )
      .pipe(unwrapData());
  }
  reorder(
    id: EntityId,
    pointIds: readonly EntityId[],
  ): Observable<PrayerRecord> {
    return this.api
      .putResource<{ pointIds: readonly EntityId[] }, PrayerDetailDto>(
        "prayers",
        resourcePath(id, "points", "order"),
        { pointIds },
      )
      .pipe(unwrapData(), map(toPrayerView));
  }
}
