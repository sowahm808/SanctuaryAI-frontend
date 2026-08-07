import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import {
  ApiClientService,
  resourcePath,
} from "../../core/api/api-client.service";
import type { AsyncJob, EntityId } from "../../models/domain.models";

export interface CampaignGenerationBrief {
  month: string;
  focus: string;
  scripture: string;
  tone: string;
  prayerQuantity: number;
}

export interface CampaignDraft {
  id: EntityId;
  title?: string;
  revision?: number;
}

@Injectable({ providedIn: "root" })
export class CampaignService {
  private readonly api = inject(ApiClientService);

  createDraft(body: CampaignGenerationBrief): Observable<CampaignDraft> {
    return this.api
      .create<CampaignGenerationBrief, CampaignDraft>("campaigns", body)
      .pipe(map((response) => response.data));
  }

  generateAll(campaignId: EntityId, revision?: number): Observable<AsyncJob> {
    return this.api
      .postResource<{ revision?: number }, AsyncJob>(
        "campaigns",
        resourcePath(campaignId, "generate"),
        { revision },
      )
      .pipe(map((response) => response.data));
  }

  regenerateSection(
    campaignId: EntityId,
    scope: string,
    revision?: number,
  ): Observable<AsyncJob> {
    return this.api
      .postResource<{ revision?: number }, AsyncJob>(
        "campaigns",
        resourcePath(campaignId, "sections", scope, "regenerate"),
        { revision },
      )
      .pipe(map((response) => response.data));
  }
}
