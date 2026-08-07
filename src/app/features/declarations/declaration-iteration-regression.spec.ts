import "@angular/compiler";
import "zone.js";
import "zone.js/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { TestBed } from "@angular/core/testing";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DeclarationPreviewComponent } from "./declaration-preview.component";
import {
  DeclarationApprovalPanelComponent,
  DeclarationTimelineComponent,
  DeclarationVersionHistoryComponent,
} from "./declaration-workflow-panels.component";
import { toDeclarationView } from "./declaration.models";

beforeAll(() => {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
});

describe("Declaration Studio iterable regression", () => {
  beforeEach(() => TestBed.resetTestingModule());

  it("renders empty versions, timeline, and null approval without throwing", async () => {
    await TestBed.configureTestingModule({
      imports: [
        DeclarationVersionHistoryComponent,
        DeclarationTimelineComponent,
        DeclarationApprovalPanelComponent,
      ],
    }).compileComponents();

    const versions = TestBed.createComponent(
      DeclarationVersionHistoryComponent,
    );
    (versions.componentInstance as any).versions = () => [];
    expect(() => versions.detectChanges()).not.toThrow();

    const timeline = TestBed.createComponent(DeclarationTimelineComponent);
    (timeline.componentInstance as any).events = () => [];
    expect(() => timeline.detectChanges()).not.toThrow();

    const approval = TestBed.createComponent(DeclarationApprovalPanelComponent);
    (approval.componentInstance as any).approval = () => null;
    (approval.componentInstance as any).status = () => "draft";
    expect(() => approval.detectChanges()).not.toThrow();
  });

  it("renders a normalized legacy record without an iterator error", async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationPreviewComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DeclarationPreviewComponent);
    const record = toDeclarationView({
      id: "legacy",
      brief: {
        audience: "Entire congregation",
        supportingScriptures: "Psalm 23:1",
      },
      variants: { full: "The Lord is my shepherd." },
    });
    (fixture.componentInstance as any).record = () => record;

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain("Psalm 23:1");
  });
});
