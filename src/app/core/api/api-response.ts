import { map, type OperatorFunction } from "rxjs";
import type { ApiResponse, CursorPage } from "../../models/domain.models";

/** Normalizes a backend cursor envelope at the transport boundary. */
export function normalizeCursorPage<T>(page: CursorPage<T>): CursorPage<T> {
  return {
    ...page,
    items: Array.isArray(page?.items) ? page.items : [],
  };
}

export function unwrapData<T>(): OperatorFunction<ApiResponse<T>, T> {
  return map((response) => response.data);
}

export function unwrapCursorPage<T>(): OperatorFunction<
  ApiResponse<CursorPage<T>>,
  CursorPage<T>
> {
  return map((response) => normalizeCursorPage(response.data));
}
