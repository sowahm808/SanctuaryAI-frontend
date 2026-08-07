import "@angular/compiler";
import { firstValueFrom, of } from "rxjs";
import { describe, expect, it } from "vitest";
import { resourcePath } from "./api-client.service";
import { unwrapCursorPage } from "./api-response";

describe("API response helpers", () => {
  it("unwraps response.data.items into a normalized collection", async () => {
    const result = await firstValueFrom(
      of({
        data: { items: ["theme-1"], nextCursor: "next" },
        correlationId: "correlation-1",
      }).pipe(unwrapCursorPage<string>()),
    );

    expect(result).toEqual({ items: ["theme-1"], nextCursor: "next" });
  });

  it("encodes each dynamic resource path segment", () => {
    expect(resourcePath("theme/one", "submit review")).toBe(
      "theme%2Fone/submit%20review",
    );
  });
});
