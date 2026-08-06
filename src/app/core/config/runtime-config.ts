import type { FirebaseOptions } from "firebase/app";

export interface RuntimeConfig {
  readonly apiBaseUrl: string;
  readonly firebase: FirebaseOptions;
}

let runtimeConfig: RuntimeConfig | undefined;
const defaultApiBaseUrl = "/api";

export async function loadRuntimeConfig(configUrl: string): Promise<void> {
  const response = await fetch(configUrl, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(
      `Unable to load public application configuration (${response.status}).`,
    );
  }
  runtimeConfig = parseRuntimeConfig(await response.json());
}

export function getRuntimeConfig(): RuntimeConfig {
  if (!runtimeConfig) {
    throw new Error("Application configuration has not been loaded.");
  }
  return runtimeConfig;
}

export function parseRuntimeConfig(value: unknown): RuntimeConfig {
  if (!isRecord(value)) {
    throw new Error("The public application configuration is invalid.");
  }

  // API responses normally use the shared `{ data, meta, correlationId }`
  // envelope, while older deployments return the configuration directly.
  const config = "data" in value ? value["data"] : value;
  if (!isRecord(config) || !isRecord(config["firebase"])) {
    throw new Error("The public application configuration is invalid.");
  }

  const apiBaseUrl = config["apiBaseUrl"] ?? defaultApiBaseUrl;
  if (!validApiBaseUrl(apiBaseUrl)) {
    throw new Error("The public application API base URL is invalid.");
  }

  const firebase = config["firebase"];
  for (const key of ["apiKey", "authDomain", "projectId"] as const) {
    if (typeof firebase[key] !== "string" || firebase[key].trim() === "") {
      throw new Error(`The public Firebase configuration is missing ${key}.`);
    }
  }
  return {
    apiBaseUrl,
    firebase: firebase as FirebaseOptions,
  };
}

function validApiBaseUrl(value: unknown): value is string {
  return (
    typeof value === "string" && value.trim() !== "" && !value.endsWith("/")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
