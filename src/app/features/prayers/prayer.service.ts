import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../core/api/api-client.service";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
import type { CursorPage, EntityId } from "../../models/domain.models";
import type {
  PrayerApproval,
  PrayerDraftForm,
  PrayerJob,
  PrayerPoint,
  PrayerRecord,
  PrayerSummary,
  PrayerTimelineEvent,
  PrayerVersion,
} from "./prayer.models";

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
  list(): Observable<CursorPage<PrayerSummary>> {
    return this.api
      .list<PrayerSummary>("prayers", PRAYER_LIST_OPTIONS)
      .pipe(unwrapCursorPage());
  }
  get(id: EntityId): Observable<PrayerRecord> {
    return this.api.get<PrayerRecord>("prayers", id).pipe(unwrapData());
  }
  create(brief: PrayerDraftForm): Observable<PrayerRecord> {
    return this.api
      .create<{ brief: PrayerDraftForm }, PrayerRecord>("prayers", { brief })
      .pipe(unwrapData());
  }
  save(
    id: EntityId,
    brief: PrayerDraftForm,
    expectedRevision: number,
  ): Observable<PrayerRecord> {
    return this.api
      .update<
        { brief: PrayerDraftForm; expectedRevision: number },
        PrayerRecord
      >("prayers", id, { brief, expectedRevision })
      .pipe(unwrapData());
  }
  generate(id: EntityId, revision: number): Observable<PrayerJob> {
    return this.api
      .postResource<{ revision: number }, PrayerJob>(
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
      .postResource<{ versionId: EntityId }, PrayerRecord>(
        "prayers",
        resourcePath(id, "submit-review"),
        { versionId },
      )
      .pipe(unwrapData());
  }
  createRevision(id: EntityId): Observable<PrayerRecord> {
    return this.api
      .postResource<Record<string, never>, PrayerRecord>(
        "prayers",
        resourcePath(id, "revisions"),
        {},
      )
      .pipe(unwrapData());
  }
  updatePoint(id: EntityId, point: PrayerPoint): Observable<PrayerRecord> {
    return this.api
      .patchResource<PrayerPoint, PrayerRecord>(
        "prayers",
        resourcePath(id, "points", point.id),
        point,
      )
      .pipe(unwrapData());
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
      .putResource<{ pointIds: readonly EntityId[] }, PrayerRecord>(
        "prayers",
        resourcePath(id, "points", "order"),
        { pointIds },
      )
      .pipe(unwrapData());
  }
}
