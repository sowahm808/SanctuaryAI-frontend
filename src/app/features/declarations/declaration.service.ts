import { Injectable, inject, isDevMode } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../core/api/api-client.service";
import { unwrapCursorPage, unwrapData } from "../../core/api/api-response";
import type { CursorPage, EntityId } from "../../models/domain.models";
import type {
  DeclarationApproval,
  DeclarationDraftForm,
  DeclarationDto,
  DeclarationJob,
  DeclarationRecord,
  DeclarationSummary,
  DeclarationSummaryDto,
  DeclarationTimelineEvent,
  DeclarationVariant,
  DeclarationVersion,
  RefineAction,
  VariantKind,
} from "./declaration.models";
import {
  asArray,
  toDeclarationSummaryView,
  toDeclarationView,
} from "./declaration.models";
@Injectable({ providedIn: "root" })
export class DeclarationService {
  private api = inject(ApiClientService);
  list(): Observable<CursorPage<DeclarationSummary>> {
    return this.api
      .list<DeclarationSummaryDto>("declarations", {
        limit: 20,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(
        unwrapCursorPage(),
        map((page) => ({
          ...page,
          items: page.items.flatMap((dto) => {
            const item = toDeclarationSummaryView(dto);
            if (!item) {
              if (isDevMode())
                console.warn(
                  "Ignoring malformed declaration summary without an id.",
                  dto,
                );
              return [];
            }
            if (dto.status !== item.status || item.revision === null) {
              if (isDevMode())
                console.warn(
                  "Loaded a legacy declaration using compatibility defaults.",
                  {
                    id: item.id,
                    status: dto.status,
                    revision: dto.revision,
                  },
                );
            }
            return [item];
          }),
        })),
      );
  }
  get(id: EntityId): Observable<DeclarationRecord> {
    return this.api
      .get<DeclarationDto>("declarations", id)
      .pipe(unwrapData(), map(toDeclarationView));
  }
  create(brief: DeclarationDraftForm): Observable<DeclarationRecord> {
    return this.api
      .create<{ brief: DeclarationDraftForm }, DeclarationRecord>(
        "declarations",
        { brief },
      )
      .pipe(unwrapData());
  }
  save(
    id: EntityId,
    brief: DeclarationDraftForm,
    expectedRevision: number,
  ): Observable<DeclarationRecord> {
    return this.api
      .update<
        { brief: DeclarationDraftForm; expectedRevision: number },
        DeclarationRecord
      >("declarations", id, { brief, expectedRevision })
      .pipe(unwrapData());
  }
  generate(id: EntityId, revision: number): Observable<DeclarationJob> {
    return this.api
      .postResource<{ revision: number }, DeclarationJob>(
        "declarations",
        resourcePath(id, "generate"),
        { revision },
      )
      .pipe(unwrapData());
  }
  timeline(id: EntityId): Observable<readonly DeclarationTimelineEvent[]> {
    return this.api
      .getResource<{ items?: unknown }>(
        "declarations",
        resourcePath(id, "timeline"),
      )
      .pipe(
        map((response) =>
          asArray<DeclarationTimelineEvent>(response.data?.items),
        ),
      );
  }
  versions(id: EntityId): Observable<readonly DeclarationVersion[]> {
    return this.api
      .getResource<{ items?: unknown }>(
        "declarations",
        resourcePath(id, "versions"),
      )
      .pipe(
        map((response) => asArray<DeclarationVersion>(response.data?.items)),
      );
  }
  approval(id: EntityId): Observable<DeclarationApproval | null> {
    return this.api
      .getResource<DeclarationApproval | null>(
        "declarations",
        resourcePath(id, "approval"),
      )
      .pipe(unwrapData());
  }
  updateVariant(
    id: EntityId,
    variant: DeclarationVariant,
  ): Observable<DeclarationRecord> {
    return this.api
      .patchResource<{ content: string }, DeclarationRecord>(
        "declarations",
        resourcePath(id, "variants", variant.id),
        { content: variant.content },
      )
      .pipe(unwrapData());
  }
  variantAction(
    id: EntityId,
    variantId: EntityId,
    action: "regenerate" | "duplicate",
  ): Observable<DeclarationRecord | DeclarationJob> {
    return this.api
      .postResource<{ action: string }, DeclarationRecord | DeclarationJob>(
        "declarations",
        resourcePath(id, "variants", variantId, "actions"),
        { action },
      )
      .pipe(unwrapData());
  }
  refine(
    id: EntityId,
    variant: VariantKind,
    action: RefineAction,
  ): Observable<DeclarationJob> {
    return this.api
      .postResource<
        { variant: VariantKind; action: RefineAction },
        DeclarationJob
      >("declarations", resourcePath(id, "refine"), { variant, action })
      .pipe(unwrapData());
  }
  submitReview(
    id: EntityId,
    versionId: EntityId,
  ): Observable<DeclarationRecord> {
    return this.api
      .postResource<{ versionId: EntityId }, DeclarationRecord>(
        "declarations",
        resourcePath(id, "submit-review"),
        { versionId },
      )
      .pipe(unwrapData());
  }
  createRevision(id: EntityId): Observable<DeclarationRecord> {
    return this.api
      .postResource<{}, DeclarationRecord>(
        "declarations",
        resourcePath(id, "revisions"),
        {},
      )
      .pipe(unwrapData());
  }
  compare(
    id: EntityId,
    from: EntityId,
    to: EntityId,
  ): Observable<readonly string[]> {
    return this.api
      .getResource<readonly string[]>(
        "declarations",
        `${resourcePath(id, "versions", "compare")}?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
      .pipe(unwrapData());
  }
}
