import { Injectable, inject } from "@angular/core";
import { map, type Observable } from "rxjs";
import { ApiClientService } from "../../core/api/api-client.service";
import type {
  ChurchProfile,
  CreateChurchProfileRequest,
} from "../../models/domain.models";

@Injectable({ providedIn: "root" })
export class ChurchProfileService {
  private readonly api = inject(ApiClientService);

  create(body: CreateChurchProfileRequest): Observable<ChurchProfile> {
    return this.api
      .create<CreateChurchProfileRequest, ChurchProfile>("organizations", body)
      .pipe(map((response) => response.data));
  }
}
