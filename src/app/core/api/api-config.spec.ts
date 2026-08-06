import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { environment } from "../../../environments/environment";
import { environment as productionEnvironment } from "../../../environments/environment.prod";

const backendOrigin = "https://sanctuaryai-backend.onrender.com";
const versionedBackendUrl = `${backendOrigin}/api/v1`;

describe("API routing configuration", () => {
  it("keeps browser API calls on the same-origin proxy path", () => {
    expect(environment.configUrl).toBe("/api/config/public");
    expect(productionEnvironment.configUrl).toBe("/api/config/public");
  });

  it("proxies local development API calls to the Render backend", () => {
    const proxyConfig = JSON.parse(readFileSync("proxy.conf.json", "utf8"));

    expect(proxyConfig["/api"].target).toBe(backendOrigin);
    expect(proxyConfig["/api"].pathRewrite["^/api"]).toBe("/api/v1");
    expect(proxyConfig["/api"].changeOrigin).toBe(true);
    expect(proxyConfig["/api"].secure).toBe(true);
  });

  it("proxies production API calls to the versioned Render backend", () => {
    const netlifyConfig = readFileSync("netlify.toml", "utf8");

    expect(netlifyConfig).toContain(`to = "${versionedBackendUrl}/:splat"`);
  });
});
