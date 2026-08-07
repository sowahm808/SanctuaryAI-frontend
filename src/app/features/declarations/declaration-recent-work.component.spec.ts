import "@angular/compiler";
import "zone.js";
import "zone.js/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";
import { TestBed } from "@angular/core/testing";
import { beforeAll, describe, expect, it } from "vitest";
import { DeclarationRecentWorkComponent } from "./declaration-recent-work.component";
import { toDeclarationSummaryView } from "./declaration.models";

beforeAll(() => {
  TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
});

describe("DeclarationRecentWorkComponent", () => {
  it("renders a null-filled legacy record without throwing during change detection", async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationRecentWorkComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(DeclarationRecentWorkComponent);
    const legacy = toDeclarationSummaryView({
      id: "legacy",
      title: null,
      status: null,
      revision: "550e8400-e29b-41d4-a716-446655440000",
      declarationType: null,
      audience: null,
      updatedAt: null,
      brief: { tone: null, serviceContext: null },
    });
    // Vitest runs this signal-input component in JIT mode, so seed the signal
    // directly rather than relying on Angular's AOT-generated input metadata.
    (fixture.componentInstance as any).items = () => (legacy ? [legacy] : []);

    expect(() => fixture.detectChanges()).not.toThrow();
    expect(fixture.nativeElement.textContent).toContain(
      "Prophetic Declaration",
    );
    expect(fixture.nativeElement.textContent).toContain("Draft");
    expect(fixture.nativeElement.textContent).not.toContain("550e8400");
  });
});
