import { HttpErrorResponse } from "@angular/common/http";
import type { ApiError, ValidationIssue } from "../../models/domain.models";

interface ProblemDetails {
  code?: string;
  detail?: string;
  correlationId?: string;
  validation?: readonly ValidationIssue[];
}

export function mapApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      code: "unexpected",
      message: "Something went wrong. Please try again.",
      retryable: false,
    };
  }
  const problem =
    typeof error.error === "object" && error.error !== null
      ? (error.error as ProblemDetails)
      : undefined;
  return {
    code: problem?.code ?? `http_${error.status || 0}`,
    message: safeMessage(error.status, problem?.detail),
    correlationId:
      problem?.correlationId ??
      error.headers.get("X-Correlation-ID") ??
      undefined,
    validation: problem?.validation,
    retryable:
      error.status === 0 ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500,
  };
}

function safeMessage(status: number, detail?: string): string {
  if (status === 400 && detail) return detail;
  if (status === 401) return "Your session has expired. Please sign in again.";
  if (status === 403)
    return "You do not have permission to perform this action.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 409)
    return (
      detail ??
      "This item changed elsewhere. Review the latest version before continuing."
    );
  if (status === 429) return "Too many requests. Wait a moment and try again.";
  if (status === 0)
    return "The service is unreachable. Your recoverable work remains on this device.";
  return status >= 500
    ? "The service is temporarily unavailable. Please try again."
    : "The request could not be completed.";
}
