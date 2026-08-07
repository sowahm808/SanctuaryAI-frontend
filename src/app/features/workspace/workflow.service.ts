import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  type ApiGroup,
} from "../../core/api/api-client.service";
import type { AsyncJob, EntityId } from "../../models/domain.models";

export interface WorkflowDraftRequest {
  kind: string;
  brief: Record<string, string>;
}

export interface WorkflowDraft {
  id: EntityId;
  revision?: number;
  currentVersionId: string;
  title?: string;
}

export interface WorkflowApiConfig {
  group: ApiGroup;
  generateResource: (id: EntityId) => string;
}

export const WORKFLOW_API_CONFIG: Readonly<Record<string, WorkflowApiConfig>> =
  {
    themes: { group: "themes", generateResource: (id) => `${id}/generate` },
    "prayer-points": {
      group: "prayers",
      generateResource: (id) => `${id}/generate`,
    },
    declarations: {
      group: "declarations",
      generateResource: (id) => `${id}/generate`,
    },
  };

@Injectable({ providedIn: "root" })
export class WorkflowService {
  private readonly api = inject(ApiClientService);

  createDraft(
    kind: string,
    brief: Record<string, string>,
  ): Observable<WorkflowDraft> {
    const config = workflowApiConfig(kind);
    return this.api
      .create<WorkflowDraftRequest, WorkflowDraft>(config.group, {
        kind,
        brief,
      })
      .pipe(map((response) => response.data));
  }

  generate(
    kind: string,
    id: EntityId,
    revision?: number,
  ): Observable<AsyncJob> {
    const config = workflowApiConfig(kind);
    return this.api
      .postResource<{ revision?: number }, AsyncJob>(
        config.group,
        config.generateResource(id),
        { revision },
      )
      .pipe(map((response) => response.data));
  }
}

export function workflowApiConfig(kind: string): WorkflowApiConfig {
  return (
    WORKFLOW_API_CONFIG[kind] ?? {
      group: "themes",
      generateResource: (id) => `${id}/generate`,
    }
  );
}
