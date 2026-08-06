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

  it("accepts the standard API response envelope", () => {
    const config = parseRuntimeConfig({
      data: {
        firebase: {
          apiKey: "public-key",
          authDomain: "auth.example",
          projectId: "project",
        },
      },
      meta: {},
      correlationId: "request-id",
    });

    expect(config.apiBaseUrl).toBe("/api");
    expect(config.firebase.projectId).toBe("project");
  });

  it("uses the same-origin API route when apiBaseUrl is omitted", () => {
    expect(
      parseRuntimeConfig({
        firebase: {
          apiKey: "public-key",
          authDomain: "auth.example",
          projectId: "project",
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
    expect(() =>
      parseRuntimeConfig({
        data: null,
      }),
    ).toThrow();
  });
});
