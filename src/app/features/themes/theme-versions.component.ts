import { DatePipe, JsonPipe } from "@angular/common";
import { Component, input, signal } from "@angular/core";
import type { ApiProblem, ThemeVersion } from "./theme.models";
@Component({
  selector: "app-theme-versions",
  standalone: true,
  imports: [DatePipe, JsonPipe],
  styles: [
    `
      .row {
        padding: 0.8rem 0;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .compare {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-top: 1rem;
      }
      .snapshot {
        overflow: auto;
        background: #f8f7fb;
        padding: 1rem;
        border-radius: 10px;
      }
      @media (max-width: 650px) {
        .compare {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Version history</p>
    <h2>Revisions</h2>
    @if (loading()) {
      <p>Loading versions…</p>
    } @else if (error()) {
      <div class="error">
        Unable to load versions.
        @if (error()?.correlationId) {
          Reference: {{ error()?.correlationId }}
        }
      </div>
    } @else {
      @for (v of versions(); track v.id) {
        <div class="row">
          <span
            ><b>Revision {{ v.revision }}</b
            ><br /><small
              >{{ v.createdAt | date: "medium" }} ·
              {{ v.creator || "Unknown creator" }}</small
            ></span
          ><span
            ><span class="badge">{{ v.approvalStatus || v.status }}</span>
            <button type="button" class="btn secondary" (click)="compare(v)">
              View / compare
            </button></span
          >
        </div>
      } @empty {
        <p class="muted">No versions yet.</p>
      }
    }
    @if (selected(); as current) {
      <div class="compare">
        <div>
          <h3>Previous version</h3>
          <pre class="snapshot">{{ previous(current) | json }}</pre>
        </div>
        <div>
          <h3>Revision {{ current.revision }}</h3>
          <pre class="snapshot">{{
            current.content || current.snapshot | json
          }}</pre>
        </div>
      </div>
    }
  </section>`,
})
export class ThemeVersionsComponent {
  readonly versions = input<readonly ThemeVersion[]>([]);
  readonly loading = input(false);
  readonly error = input<ApiProblem | null>(null);
  readonly selected = signal<ThemeVersion | null>(null);
  compare(v: ThemeVersion) {
    this.selected.set(v);
  }
  previous(v: ThemeVersion) {
    const a = this.versions(),
      i = a.findIndex((x) => x.id === v.id);
    const p = a[i + 1] || a[i - 1];
    return p?.content || p?.snapshot || {};
  }
}
