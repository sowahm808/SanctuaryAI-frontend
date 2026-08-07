import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  type ApiGroup,
} from "../../core/api/api-client.service";
import type {
  AsyncJob,
  CursorPage,
  EntityId,
} from "../../models/domain.models";

export type WorkflowKind = "themes" | "prayer-points" | "declarations";
export type ContentWorkflowStatus =
  | "draft"
  | "generating"
  | "version_ready"
  | "pending_approval"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published"
  | "failed";

export interface WorkflowDraftRequest {
  kind: WorkflowKind;
  brief: Readonly<Record<string, string>>;
  expectedRevision?: number;
}
export interface WorkflowDraft {
  id: EntityId;
  revision: number;
  currentVersionId: EntityId;
  title?: string;
  status: ContentWorkflowStatus;
  brief?: Readonly<Record<string, string>>;
  generatedContent?: unknown;
  updatedAt?: string;
}
export interface ContentGenerationResult {
  contentId: EntityId;
  contentVersionId: EntityId;
  revision: number;
}
export interface WorkflowApiConfig {
  readonly group: ApiGroup;
  readonly generateResource: (id: EntityId) => string;
  readonly submitReviewResource: (id: EntityId) => string;
  readonly requiresApproval: true;
}

export const WORKFLOW_API_CONFIG: Readonly<
  Record<WorkflowKind, WorkflowApiConfig>
> = {
  themes: contentConfig("themes"),
  "prayer-points": contentConfig("prayers"),
  declarations: contentConfig("declarations"),
};

@Injectable({ providedIn: "root" })
export class WorkflowService {
  private readonly api = inject(ApiClientService);

  createDraft(
    kind: WorkflowKind,
    brief: Readonly<Record<string, string>>,
  ): Observable<WorkflowDraft> {
    const config = workflowApiConfig(kind);
    return this.api
      .create<WorkflowDraftRequest, WorkflowDraft>(config.group, {
        kind,
        brief,
      })
      .pipe(map(({ data }) => data));
  }

  saveDraft(
    kind: WorkflowKind,
    id: EntityId,
    brief: Readonly<Record<string, string>>,
    expectedRevision: number,
  ): Observable<WorkflowDraft> {
    return this.api
      .update<WorkflowDraftRequest, WorkflowDraft>(
        workflowApiConfig(kind).group,
        id,
        { kind, brief, expectedRevision },
      )
      .pipe(map(({ data }) => data));
  }

  generate(
    kind: WorkflowKind,
    id: EntityId,
    revision: number,
  ): Observable<AsyncJob<ContentGenerationResult>> {
    const config = workflowApiConfig(kind);
    return this.api
      .postResource<{ revision: number }, AsyncJob<ContentGenerationResult>>(
        config.group,
        config.generateResource(id),
        { revision },
      )
      .pipe(map(({ data }) => data));
  }

  get(kind: WorkflowKind, id: EntityId): Observable<WorkflowDraft> {
    return this.api
      .get<WorkflowDraft>(workflowApiConfig(kind).group, id)
      .pipe(map(({ data }) => data));
  }

  list(kind: WorkflowKind): Observable<CursorPage<WorkflowDraft>> {
    return this.api
      .list<WorkflowDraft>(workflowApiConfig(kind).group, {
        limit: 20,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(map(({ data }) => data));
  }
}

export function workflowApiConfig(kind: WorkflowKind): WorkflowApiConfig {
  const config: WorkflowApiConfig | undefined = WORKFLOW_API_CONFIG[kind];
  if (!config) throw new Error(`Unsupported workflow kind: ${kind}`);
  return config;
}

function contentConfig(group: ApiGroup): WorkflowApiConfig {
  return {
    group,
    generateResource: (id) => `${id}/generate`,
    submitReviewResource: (id) => `${id}/submit-review`,
    requiresApproval: true,
  };
}
