import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type { EntityId, IsoDateTime } from "../../models/domain.models";

export interface SermonBlock {
  key: string;
  label: string;
  minutes: number;
  content: string;
}

export interface SermonMetadata {
  title: string;
  series: string;
  serviceDate: string;
  speaker: string;
  scriptures: string;
  translation: string;
  audience: string;
  duration: 15 | 30 | 45 | 60 | 90;
  tone: string;
  status: "Draft" | "Awaiting Approval" | "Approved" | "Published";
}

export interface SermonRecord {
  id: EntityId;
  metadata: SermonMetadata;
  sections: readonly SermonBlock[];
  revision: number;
  currentVersionId: string;
  updatedAt: IsoDateTime;
}

export interface SermonDraftRequest {
  metadata: SermonMetadata;
  sections: readonly SermonBlock[];
  revision?: number;
}

export interface AsyncJob {
  id: EntityId;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  label?: string;
  preview?: string;
  diff?: string;
}

@Injectable({ providedIn: "root" })
export class SermonService {
  private readonly api = inject(ApiClientService);

  createDraft(body: SermonDraftRequest): Observable<SermonRecord> {
    return this.api
      .create<SermonDraftRequest, SermonRecord>("sermons", body)
      .pipe(map((response) => response.data));
  }

  saveDraft(id: EntityId, body: SermonDraftRequest): Observable<SermonRecord> {
    return this.api
      .putResource<SermonDraftRequest, SermonRecord>(
        "sermons",
        `${id}/draft`,
        body,
      )
      .pipe(map((response) => response.data));
  }

  checkConflicts(id: EntityId, revision?: number): Observable<SermonRecord> {
    return this.api
      .getResource<SermonRecord>(
        "sermons",
        revision === undefined ? id : `${id}?revision=${revision}`,
      )
      .pipe(map((response) => response.data));
  }

  requestExport(id: EntityId, format: string): Observable<AsyncJob> {
    return this.api
      .postResource<{ format: string }, AsyncJob>("sermons", `${id}/exports`, {
        format,
      })
      .pipe(map((response) => response.data));
  }

  runAi(
    id: EntityId,
    body: { label: string; scope: "Section" | "Document"; sectionKey?: string },
  ): Observable<AsyncJob> {
    return this.api
      .postResource<typeof body, AsyncJob>("sermons", `${id}/ai-jobs`, body)
      .pipe(map((response) => response.data));
  }
}
