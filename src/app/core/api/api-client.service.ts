import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import type { Observable } from "rxjs";
import type {
  ApiResponse,
  CursorPage,
  EntityId,
  QueryOptions,
} from "../../models/domain.models";
import { getRuntimeConfig } from "../config/runtime-config";

export const API_GROUPS = [
  "organizations",
  "dashboard",
  "themes",
  "campaigns",
  "sermons",
  "prayers",
  "declarations",
  "flyers",
  "videos",
  "media",
  "approvals",
  "social-accounts",
  "social-posts",
  "calendar",
  "analytics",
  "notifications",
  "users",
  "audit",
  "jobs",
] as const;
export type ApiGroup = (typeof API_GROUPS)[number];

/** A typed transport boundary used by feature services; components never use HttpClient. */
@Injectable({ providedIn: "root" })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  list<T>(
    group: ApiGroup,
    options: QueryOptions = {},
  ): Observable<ApiResponse<CursorPage<T>>> {
    return this.http.get<ApiResponse<CursorPage<T>>>(this.url(group), {
      params: queryParams(options),
      withCredentials: true,
    });
  }
  get<T>(group: ApiGroup, id: EntityId): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(
      `${this.url(group)}/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }
  getResource<T>(
    group: ApiGroup,
    resource: string,
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.url(group)}/${resource}`, {
      withCredentials: true,
    });
  }
  getSingleton<T>(
    group: ApiGroup,
    resource: string,
  ): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(
      `${this.url(group)}/${encodeURIComponent(resource)}`,
      { withCredentials: true },
    );
  }
  create<TBody extends object, TResult>(
    group: ApiGroup,
    body: TBody,
  ): Observable<ApiResponse<TResult>> {
    return this.http.post<ApiResponse<TResult>>(this.url(group), body, {
      withCredentials: true,
    });
  }
  update<TBody extends object, TResult>(
    group: ApiGroup,
    id: EntityId,
    body: TBody,
  ): Observable<ApiResponse<TResult>> {
    return this.http.patch<ApiResponse<TResult>>(
      `${this.url(group)}/${encodeURIComponent(id)}`,
      body,
      { withCredentials: true },
    );
  }
  putResource<TBody extends object, TResult>(
    group: ApiGroup,
    resource: string,
    body: TBody,
  ): Observable<ApiResponse<TResult>> {
    return this.http.put<ApiResponse<TResult>>(
      `${this.url(group)}/${resource}`,
      body,
      { withCredentials: true },
    );
  }
  patchResource<TBody extends object, TResult>(
    group: ApiGroup,
    resource: string,
    body: TBody,
  ): Observable<ApiResponse<TResult>> {
    return this.http.patch<ApiResponse<TResult>>(
      `${this.url(group)}/${resource}`,
      body,
      { withCredentials: true },
    );
  }
  postResource<TBody extends object, TResult>(
    group: ApiGroup,
    resource: string,
    body: TBody,
  ): Observable<ApiResponse<TResult>> {
    return this.http.post<ApiResponse<TResult>>(
      `${this.url(group)}/${resource}`,
      body,
      { withCredentials: true },
    );
  }
  remove(group: ApiGroup, id: EntityId): Observable<void> {
    return this.http.delete<void>(
      `${this.url(group)}/${encodeURIComponent(id)}`,
      { withCredentials: true },
    );
  }
  private url(group: ApiGroup): string {
    return `${getRuntimeConfig().apiBaseUrl}/${group}`;
  }
}

function queryParams(options: QueryOptions): HttpParams {
  let params = new HttpParams();
  if (options.cursor) params = params.set("cursor", options.cursor);
  if (options.limit !== undefined) params = params.set("limit", options.limit);
  if (options.search) params = params.set("search", options.search);
  if (options.sort) params = params.set("sort", options.sort);
  if (options.direction) params = params.set("direction", options.direction);
  for (const [key, value] of Object.entries(options.filters ?? {})) {
    for (const item of typeof value === "string" ? [value] : value)
      params = params.append(`filter[${key}]`, item);
  }
  return params;
}
