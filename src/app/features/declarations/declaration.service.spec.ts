import "@angular/compiler";
import "zone.js";
import "zone.js/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { TestBed } from "@angular/core/testing";
import { firstValueFrom, of } from "rxjs";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiClientService } from "../../core/api/api-client.service";
import type { EntityId } from "../../models/domain.models";
import { DeclarationService } from "./declaration.service";

beforeAll(() => {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
});

describe("DeclarationService response normalization", () => {
  const api = {
    list: vi.fn(),
    get: vi.fn(),
    getResource: vi.fn(),
  };
  let service: DeclarationService;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        DeclarationService,
        { provide: ApiClientService, useValue: api },
      ],
    });
    service = TestBed.inject(DeclarationService);
  });

  it("extracts recent work from data.items", async () => {
    api.list.mockReturnValue(of({ data: { items: [] } }));
    await expect(firstValueFrom(service.list())).resolves.toMatchObject({
      items: [],
    });
  });

  it.each([
    ["versions", "versions"],
    ["timeline", "timeline"],
  ] as const)("extracts %s from data.items", async (method, segment) => {
    api.getResource.mockReturnValue(of({ data: { items: [] } }));
    await expect(
      firstValueFrom(service[method]("declaration-1" as EntityId)),
    ).resolves.toEqual([]);
    expect(api.getResource).toHaveBeenCalledWith(
      "declarations",
      `declaration-1/${segment}`,
    );
  });

  it("preserves a null approval as a non-iterable singleton", async () => {
    api.getResource.mockReturnValue(of({ data: null }));
    await expect(
      firstValueFrom(service.approval("declaration-1" as EntityId)),
    ).resolves.toBeNull();
  });
});
