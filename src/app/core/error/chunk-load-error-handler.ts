import { ErrorHandler, Injectable } from "@angular/core";

const CHUNK_LOAD_RETRY_KEY = "sanctuary-ai:chunk-load-retry";

@Injectable()
export class ChunkLoadErrorHandler implements ErrorHandler {
  handleError(error: unknown): void {
    if (isChunkLoadError(error) && typeof window !== "undefined") {
      const currentUrl = window.location.href;
      const lastRetryUrl = window.sessionStorage.getItem(CHUNK_LOAD_RETRY_KEY);

      if (lastRetryUrl !== currentUrl) {
        window.sessionStorage.setItem(CHUNK_LOAD_RETRY_KEY, currentUrl);
        window.location.reload();
        return;
      }
    }

    console.error(error);
  }
}

function isChunkLoadError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed") ||
    message.includes("Loading chunk") ||
    message.includes("ChunkLoadError")
  );
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }

  if (typeof error === "string") {
    return error;
  }

  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "";
}
