import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../core/api/api-client.service";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
import type { EntityId } from "../../models/domain.models";
import type {
  ThemeApproval,
  ThemeComment,
  ThemeDraftForm,
  ThemeJob,
  ThemePageResult,
  ThemeRecord,
  ThemeRefineRequest,
  ThemeSaveRequest,
  ThemeTimelineEvent,
  ThemeSummary,
  ThemeVersion,
} from "./theme.models";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly api = inject(ApiClientService);
  list(): Observable<ThemePageResult> {
    return this.api
      .list<ThemeSummary>("themes", {
        limit: 20,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(unwrapCursorPage<ThemeSummary>());
  }
  get(id: EntityId): Observable<ThemeRecord> {
    return this.api.get<ThemeRecord>("themes", id).pipe(unwrapData());
  }
  create(brief: ThemeDraftForm): Observable<ThemeRecord> {
    return this.api
      .create<ThemeSaveRequest, ThemeRecord>("themes", { brief })
      .pipe(unwrapData());
  }
  save(
    id: EntityId,
    brief: ThemeDraftForm,
    expectedRevision: number,
  ): Observable<ThemeRecord> {
    return this.api
      .update<ThemeSaveRequest, ThemeRecord>("themes", id, {
        brief,
        expectedRevision,
      })
      .pipe(unwrapData());
  }
  generate(id: EntityId, revision: number): Observable<ThemeJob> {
    return this.api
      .postResource<{ revision: number }, ThemeJob>(
        "themes",
        resourcePath(id, "generate"),
        { revision },
      )
      .pipe(unwrapData());
  }
  refine(id: EntityId, request: ThemeRefineRequest): Observable<ThemeJob> {
    return this.api
      .postResource<ThemeRefineRequest, ThemeJob>(
        "themes",
        resourcePath(id, "refine"),
        request,
      )
      .pipe(unwrapData());
  }
  timeline(id: EntityId): Observable<readonly ThemeTimelineEvent[]> {
    return this.api
      .getResource<readonly ThemeTimelineEvent[]>(
        "themes",
        resourcePath(id, "timeline"),
      )
      .pipe(unwrapData());
  }
  versions(id: EntityId): Observable<readonly ThemeVersion[]> {
    return this.api
      .getResource<readonly ThemeVersion[]>(
        "themes",
        resourcePath(id, "versions"),
      )
      .pipe(unwrapData());
  }
  approval(id: EntityId): Observable<ThemeApproval> {
    return this.api
      .getResource<ThemeApproval>("themes", resourcePath(id, "approval"))
      .pipe(unwrapData());
  }
  submitReview(id: EntityId): Observable<ThemeRecord> {
    return this.api
      .postResource<Record<string, never>, ThemeRecord>(
        "themes",
        resourcePath(id, "submit-review"),
        {},
      )
      .pipe(unwrapData());
  }
  createRevision(id: EntityId): Observable<ThemeRecord> {
    return this.api
      .postResource<Record<string, never>, ThemeRecord>(
        "themes",
        resourcePath(id, "revisions"),
        {},
      )
      .pipe(unwrapData());
  }
  comments(id: EntityId): Observable<readonly ThemeComment[]> {
    return this.api
      .getResource<readonly ThemeComment[]>(
        "themes",
        resourcePath(id, "comments"),
      )
      .pipe(unwrapData());
  }
  addComment(id: EntityId, body: string): Observable<ThemeComment> {
    return this.api
      .postResource<{ body: string }, ThemeComment>(
        "themes",
        resourcePath(id, "comments"),
        { body },
      )
      .pipe(unwrapData());
  }
  updateComment(
    id: EntityId,
    commentId: EntityId,
    body: string,
  ): Observable<ThemeComment> {
    return this.api
      .patchResource<{ body: string }, ThemeComment>(
        "themes",
        resourcePath(id, "comments", commentId),
        { body },
      )
      .pipe(unwrapData());
  }
}
