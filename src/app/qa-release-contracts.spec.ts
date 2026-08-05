import "@angular/compiler";
import { describe, expect, it } from "vitest";
import { routes } from "./app.routes";
import { FormControl, FormGroup } from "@angular/forms";
import { applyServerValidation } from "./core/forms/server-validation";
import type { Permission } from "./models/domain.models";

const criticalPermissionRoutes: Record<string, Permission[]> = {
  "church-profile": ["settings.manage"],
  "brand-kit": ["settings.manage"],
  themes: ["themes.read"],
  sermons: ["sermons.create"],
  "flyer-studio": ["flyers.edit"],
  "team-management": ["users.manage"],
  settings: ["settings.manage"],
};

function appChildren() {
  const appRoute = routes.find((route) => route.path === "app");
  return appRoute?.children ?? [];
}

describe("release QA route contract", () => {
  it("keeps protected application routes behind auth and organization setup guards", () => {
    const appRoute = routes.find((route) => route.path === "app");

    expect(appRoute?.canActivate?.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps permission-sensitive routes explicit and auditable", () => {
    for (const [path, permissions] of Object.entries(
      criticalPermissionRoutes,
    )) {
      const route = appChildren().find((child) => child.path === path);

      expect(route?.canActivate?.length).toBeGreaterThan(0);
      expect(route?.data?.["permissions"]).toEqual(permissions);
    }
  });

  it("keeps canonical redirects for renamed deep links", () => {
    expect(appChildren()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "campaigns",
          redirectTo: "monthly-campaigns",
        }),
        expect.objectContaining({
          path: "social",
          redirectTo: "social-publisher",
        }),
        expect.objectContaining({
          path: "team",
          redirectTo: "team-management",
        }),
      ]),
    );
  });
});

describe("release QA server validation contract", () => {
  it("maps server field errors to matching form controls", () => {
    const form = new FormGroup({
      email: new FormControl("pastor@example.com"),
    });

    applyServerValidation(form, [
      {
        field: "email",
        message: "Use a church email.",
        code: "invalid_domain",
      },
      { field: "missing", message: "Required.", code: "required" },
    ]);

    expect(form.controls.email.errors).toEqual({
      server: "Use a church email.",
    });
    expect(form.errors).toEqual({ server: "Required." });
  });
});
