import "@angular/compiler";
import "zone.js";
import "zone.js/testing";
import { TestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { of } from "rxjs";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ApiClientService } from "../../../core/api/api-client.service";
import { FlyerHistoryService } from "./flyer-history.service";
import { FlyerApiService } from "./flyer-api.service";
import { FlyerViewModelMapper } from "./flyer-view-model.mapper";

beforeAll(() => {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
});

describe("Flyer production services", () => {
  it("bounds undo history and clears redo after a new edit", () => {
    const history = new FlyerHistoryService();
    for (let index = 0; index < 70; index++) history.capture({ index });
    let state = history.undo({ index: 70 }) as { index: number };
    expect(state.index).toBe(69);
    expect(history.canRedo()).toBe(true);
    history.capture({ index: 100 });
    expect(history.canRedo()).toBe(false);
    for (let index = 0; index < 50; index++)
      state = history.undo(state) as { index: number };
    expect(history.canUndo()).toBe(false);
  });

  it("normalizes null legacy arrays and API envelopes for iteration", () => {
    const mapper = new FlyerViewModelMapper();
    const project = mapper.project({
      id: "flyer-1",
      revision: "rev-1",
      supportingScriptures: null,
      assetIds: null,
    });
    expect(project.assetIds).toEqual([]);
    expect(project.supportingScriptures).toEqual([]);
    expect(mapper.versions({ data: { items: null } })).toEqual([]);
    expect(mapper.timeline({ data: null })).toEqual([]);
    expect(
      mapper.approval({ id: "a", versionId: "v", comments: null })?.comments,
    ).toEqual([]);
  });

  it("sends the current expectedRevision and returns the replacement token", () => {
    const update = vi.fn().mockReturnValue(
      of({
        data: {
          id: "flyer-1",
          revisionToken: "rev-2",
          brief: { title: "Saved" },
        },
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        FlyerApiService,
        FlyerViewModelMapper,
        { provide: ApiClientService, useValue: { update } },
      ],
    });
    TestBed.inject(FlyerApiService)
      .save("flyer-1", {
        expectedRevision: "rev-1",
        brief: {
          title: "Saved",
          subtitle: "",
          flyerType: "announcement",
          campaignId: "",
          linkedResourceType: "",
          linkedResourceId: "",
          primaryScripture: "",
          supportingScriptures: [],
          eventDate: "",
          eventTime: "",
          venue: "",
          speaker: "",
          cta: "",
          audience: "",
          website: "",
          contact: "",
          notes: "",
        },
        editorJson: {},
        selectedSize: "1080x1080",
        assetIds: [],
      })
      .subscribe((saved) => expect(saved.revisionToken).toBe("rev-2"));
    expect(update.mock.calls[0][2].expectedRevision).toBe("rev-1");
  });
});
