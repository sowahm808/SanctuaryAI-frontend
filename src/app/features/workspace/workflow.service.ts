import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
  type ApiGroup,
} from "../../core/api/api-client.service";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
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
  | "failed"
  | "cancelled";

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
  versionId: EntityId;
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
      .pipe(unwrapData());
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
      .pipe(unwrapData());
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
      .pipe(unwrapData());
  }

  get(kind: WorkflowKind, id: EntityId): Observable<WorkflowDraft> {
    return this.api
      .get<WorkflowDraft>(workflowApiConfig(kind).group, id)
      .pipe(unwrapData());
  }

  list(kind: WorkflowKind): Observable<CursorPage<WorkflowDraft>> {
    return this.api
      .list<WorkflowDraft>(workflowApiConfig(kind).group, {
        limit: 20,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(unwrapCursorPage());
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
    generateResource: (id) => resourcePath(id, "generate"),
    submitReviewResource: (id) => resourcePath(id, "submit-review"),
    requiresApproval: true,
  };
}
