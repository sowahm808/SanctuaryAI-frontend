import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../../core/api/api-client.service";
import { unwrapData } from "../../../core/api/api-response";
import type { ApiResponse } from "../../../models/domain.models";
import type {
  AsyncJobView,
  BrandKitView,
  FlyerApprovalView,
  FlyerBrief,
  FlyerProjectView,
  FlyerSummaryView,
  FlyerTimelineView,
  FlyerVariantView,
  FlyerVersionView,
  MediaAssetView,
  RevisionToken,
} from "../flyer.models";
import { FlyerViewModelMapper } from "./flyer-view-model.mapper";
@Injectable({ providedIn: "root" })
export class FlyerApiService {
  private api = inject(ApiClientService);
  private mapper = inject(FlyerViewModelMapper);
  list(): Observable<FlyerSummaryView[]> {
    return this.api
      .list<Record<string, unknown>>("flyers", {
        limit: 20,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(map((x) => this.mapper.summaries(x)));
  }
  get(id: string): Observable<FlyerProjectView> {
    return this.api.get<Record<string, unknown>>("flyers", id).pipe(
      unwrapData(),
      map((x) => this.mapper.project(x)),
    );
  }
  create(body: {
    brief: FlyerBrief;
    editorJson: unknown;
    selectedSize: string;
    assetIds: string[];
  }): Observable<FlyerProjectView> {
    return this.api
      .create<typeof body, Record<string, unknown>>("flyers", body)
      .pipe(
        unwrapData(),
        map((x) => this.mapper.project(x)),
      );
  }
  save(
    id: string,
    body: {
      expectedRevision: RevisionToken;
      brief: FlyerBrief;
      editorJson: unknown;
      selectedSize: string;
      customWidth?: number;
      customHeight?: number;
      assetIds: string[];
    },
  ): Observable<FlyerProjectView> {
    return this.api
      .update<typeof body, Record<string, unknown>>("flyers", id, body)
      .pipe(
        unwrapData(),
        map((x) => this.mapper.project(x)),
      );
  }
  variants(id: string): Observable<FlyerVariantView[]> {
    return this.api
      .getResource<unknown>("flyers", resourcePath(id, "variants"))
      .pipe(map((x) => this.mapper.variants(x)));
  }
  versions(id: string): Observable<FlyerVersionView[]> {
    return this.api
      .getResource<unknown>("flyers", resourcePath(id, "versions"))
      .pipe(map((x) => this.mapper.versions(x)));
  }
  timeline(id: string): Observable<FlyerTimelineView[]> {
    return this.api
      .getResource<unknown>("flyers", resourcePath(id, "timeline"))
      .pipe(map((x) => this.mapper.timeline(x)));
  }
  approval(id: string): Observable<FlyerApprovalView | null> {
    return this.api
      .getResource<FlyerApprovalView | null>(
        "flyers",
        resourcePath(id, "approval"),
      )
      .pipe(
        unwrapData(),
        map((x) => this.mapper.approval(x)),
      );
  }
  generate(id: string, revision: RevisionToken): Observable<AsyncJobView> {
    return this.api
      .postResource<{ expectedRevision: RevisionToken }, AsyncJobView>(
        "flyers",
        resourcePath(id, "render"),
        { expectedRevision: revision },
      )
      .pipe(unwrapData());
  }
  submitReview(id: string, versionId: string): Observable<FlyerProjectView> {
    return this.api
      .postResource<{ versionId: string }, Record<string, unknown>>(
        "flyers",
        resourcePath(id, "submit-review"),
        { versionId },
      )
      .pipe(
        unwrapData(),
        map((x) => this.mapper.project(x)),
      );
  }
  export(
    id: string,
    variantId: string,
    format: "png" | "jpg" | "webp" | "pdf",
  ): Observable<AsyncJobView> {
    return this.api
      .postResource<{ variantId: string; format: string }, AsyncJobView>(
        "flyers",
        resourcePath(id, "exports"),
        { variantId, format },
      )
      .pipe(unwrapData());
  }
  job(id: string): Observable<AsyncJobView> {
    return this.api.get<AsyncJobView>("jobs", id).pipe(unwrapData());
  }
  brandKit(): Observable<BrandKitView> {
    return this.api
      .getSingleton<BrandKitView>("organizations", "brand-kit")
      .pipe(unwrapData());
  }
  media(): Observable<MediaAssetView[]> {
    return this.api
      .list<MediaAssetView>("media", {
        limit: 50,
        sort: "updatedAt",
        direction: "desc",
      })
      .pipe(map((x) => (Array.isArray(x.data?.items) ? x.data.items : [])));
  }
  upload(file: File): Observable<MediaAssetView> {
    const body = { name: file.name, mimeType: file.type, size: file.size };
    return this.api
      .create<typeof body, MediaAssetView>("media", body)
      .pipe(unwrapData());
  }
  qrCode(url: string): Observable<MediaAssetView> {
    return this.api
      .postResource<{ targetUrl: string }, MediaAssetView>(
        "flyers",
        "qr-codes",
        { targetUrl: url },
      )
      .pipe(unwrapData());
  }
}
