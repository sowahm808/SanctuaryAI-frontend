import { describe, expect, it } from "vitest";
import { parseRuntimeConfig } from "./runtime-config";

describe("runtime configuration", () => {
  it("accepts deployment-provided public configuration", () => {
    expect(
      parseRuntimeConfig({
        apiBaseUrl: "/api",
        firebase: {
          apiKey: "public-key",
          authDomain: "auth.example",
          projectId: "project",
          appId: "app",
        },
      }).apiBaseUrl,
    ).toBe("/api");
  });

  it("rejects incomplete or malformed configuration", () => {
    expect(() =>
      parseRuntimeConfig({ apiBaseUrl: "/api/", firebase: {} }),
    ).toThrow();
    expect(() =>
      parseRuntimeConfig({ apiBaseUrl: "", firebase: {} }),
    ).toThrow();
  });
});
