import {
  Directive,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from "@angular/core";
import type { Permission } from "../models/domain.models";
import { SessionService } from "../services/session.service";

/** Convenience-only UI policy; protected API endpoints must enforce the same permission. */
@Directive({ selector: "[appHasPermission]", standalone: true })
export class HasPermissionDirective {
  readonly appHasPermission = input.required<Permission>();
  private readonly session = inject(SessionService);
  private readonly template = inject(TemplateRef<unknown>);
  private readonly view = inject(ViewContainerRef);
  private rendered = false;
  constructor() {
    effect(() => {
      const allowed = this.session.can(this.appHasPermission());
      if (allowed && !this.rendered) {
        this.view.createEmbeddedView(this.template);
        this.rendered = true;
      } else if (!allowed && this.rendered) {
        this.view.clear();
        this.rendered = false;
      }
    });
  }
}
