import { Component, input, output } from "@angular/core";
import type { EntityId } from "../../models/domain.models";
import type { DeclarationSummary } from "./declaration.models";
import { declarationTitle, statusLabel } from "./declaration.models";
@Component({
  selector: "app-declaration-recent-work",
  standalone: true,
  styles: [
    `
      section {
        padding: 1.3rem;
      }
      .list {
        display: grid;
        gap: 0.65rem;
      }
      .item {
        width: 100%;
        text-align: left;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: var(--surface);
        padding: 1rem;
        transition: 0.18s;
      }
      .item:hover,
      .item:focus-visible {
        border-color: var(--violet);
        transform: translateY(-1px);
      }
      .item.selected {
        border-color: var(--violet);
        background: #f7f4ff;
        box-shadow: 0 0 0 2px #e5dcff;
      }
      .top,
      .meta {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .meta {
        margin-top: 0.65rem;
        align-items: end;
      }
      .error {
        color: var(--danger);
      }
    `,
  ],
  template: `<section class="card">
    <div class="section-head">
      <div>
        <p class="eyebrow">Recent work</p>
        <h2>Declarations</h2>
      </div>
      <button
        type="button"
        class="btn secondary"
        (click)="refresh.emit()"
        [disabled]="loading()"
      >
        Refresh
      </button>
    </div>
    @if (error()) {
      <div class="error" role="alert">
        <p>{{ error() }}</p>
        <button class="btn secondary" (click)="refresh.emit()">Retry</button>
      </div>
    } @else if (loading()) {
      <p aria-live="polite">Loading declarations…</p>
    } @else if (!items().length) {
      <p>
        <b>No declarations yet.</b><br /><span class="muted"
          >Create your first prophetic declaration.</span
        >
      </p>
    } @else {
      <div class="list">
        @for (item of items(); track item.id) {
          <button
            class="item"
            [class.selected]="selectedId() === item.id"
            [attr.aria-current]="selectedId() === item.id ? 'true' : null"
            (click)="selected.emit(item.id)"
          >
            <span class="top"
              ><b>{{ title(item) }}</b
              ><span class="badge">{{ status(item.status) }}</span></span
            ><span class="muted"
              >{{ item.declarationType || "Prophetic" }} ·
              {{ item.audience?.join(", ") || "Audience not set" }}</span
            ><span class="meta"
              ><span
                ><b>{{
                  item.primaryScripture?.reference || "Scripture not set"
                }}</b
                ><br /><small [title]="item.updatedAt">{{
                  relative(item.updatedAt)
                }}</small></span
              ><b>v{{ item.revision }}</b></span
            >
          </button>
        }
      </div>
    }
  </section>`,
})
export class DeclarationRecentWorkComponent {
  items = input.required<readonly DeclarationSummary[]>();
  selectedId = input<EntityId | null>(null);
  loading = input(false);
  error = input<string | null>(null);
  selected = output<EntityId>();
  refresh = output<void>();
  title = declarationTitle;
  status = statusLabel;
  relative(value: string) {
    const d = new Date(value),
      days = Math.floor((Date.now() - d.getTime()) / 86400000);
    if (days === 0) {
      const m = Math.max(1, Math.floor((Date.now() - d.getTime()) / 60000));
      return `Updated ${m}m ago`;
    }
    if (days === 1) return "Yesterday";
    return d.toLocaleDateString("en", { month: "short", day: "numeric" });
  }
}
