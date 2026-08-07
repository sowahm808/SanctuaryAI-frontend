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
    update: vi.fn(),
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

  it("uses the detail GET revision and then the new PATCH revision", async () => {
    const id = "declaration-1" as EntityId;
    const brief = {
      title: "Declaration",
      declarationType: "Prophetic",
      primaryScripture: { reference: "John 3:16" },
      supportingScriptures: [],
      tone: "Prophetic",
      audience: ["Entire congregation"],
      serviceContext: {},
      objective: "Hope",
      advancedOptions: {
        length: "standard",
        includeScriptureQuotations: true,
        includeCongregationalResponse: true,
        includeAmenResponse: true,
        includeSocialVersion: false,
        includeFlyerVersion: false,
        includeVideoVoiceoverVersion: false,
        includePersonalVersion: false,
        includeCongregationalVersion: true,
      },
    } as const;
    const dto = (revision: string) => ({
      data: {
        id,
        revision,
        status: "draft",
        brief,
        variants: [],
        updatedAt: "2026-08-07T00:00:00Z",
      },
    });
    api.get.mockReturnValue(of(dto("A")));
    api.update
      .mockReturnValueOnce(of(dto("B")))
      .mockReturnValueOnce(of(dto("C")));

    const loaded = await firstValueFrom(service.get(id));
    const first = await firstValueFrom(
      service.save(id, brief as never, loaded.revisionToken),
    );
    await firstValueFrom(service.save(id, brief as never, first.revisionToken));

    expect(api.update.mock.calls[0][2].expectedRevision).toBe("A");
    expect(api.update.mock.calls[1][2].expectedRevision).toBe("B");
  });
});
