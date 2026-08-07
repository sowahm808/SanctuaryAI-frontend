import { Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  PRAYER_CATEGORIES,
  formatScripture,
  prayerTitle,
  type PrayerStatus,
  type PrayerSummary,
} from "./prayer.models";
@Component({
  selector: "app-prayer-recent-work",
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .head,
      .filters,
      .item,
      .meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .head,
      .item {
        justify-content: space-between;
      }
      .head h2 {
        margin: 0.15rem 0;
      }
      .filters {
        margin: 1rem 0;
      }
      .filters input {
        flex: 1;
      }
      .filters input,
      .filters select {
        border: 1px solid var(--line);
        border-radius: 9px;
        padding: 0.6rem;
      }
      .list {
        display: grid;
        gap: 0.35rem;
      }
      .item {
        width: 100%;
        border: 0;
        border-radius: 12px;
        background: transparent;
        text-align: left;
        padding: 0.85rem;
        transition: 0.15s;
      }
      .item:hover {
        background: #f7f5fc;
      }
      .item.selected {
        background: #f0ecfb;
        box-shadow: inset 3px 0 var(--violet);
      }
      .item strong {
        display: block;
        margin-bottom: 0.3rem;
      }
      .meta {
        justify-content: flex-end;
        flex-wrap: wrap;
      }
      .skeleton {
        height: 4.4rem;
        border-radius: 12px;
        background: linear-gradient(90deg, #eee 25%, #fafafa 45%, #eee 65%);
        background-size: 300%;
        animation: pulse 1.5s infinite;
      }
      .empty {
        text-align: center;
        padding: 2rem 0.5rem;
      }
      .error {
        color: var(--danger);
      }
      @keyframes pulse {
        to {
          background-position: -100%;
        }
      }
      @media (max-width: 560px) {
        .filters {
          align-items: stretch;
          flex-direction: column;
        }
        .item {
          align-items: flex-start;
          flex-direction: column;
        }
        .meta {
          justify-content: flex-start;
        }
      }
    `,
  ],
  template: `<section class="card">
    <div class="head">
      <div>
        <p class="eyebrow">Content library</p>
        <h2>Recent work</h2>
      </div>
      <button class="btn secondary" type="button" (click)="refresh.emit()">
        Refresh
      </button>
    </div>
    <div class="filters">
      <input
        aria-label="Search prayer collections"
        placeholder="Search title, theme or scripture"
        [(ngModel)]="query"
      /><select aria-label="Filter category" [(ngModel)]="category">
        <option value="">All categories</option>
        @for (value of categories; track value) {
          <option [value]="value">{{ value }}</option>
        }
      </select>
    </div>
    @if (loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div class="skeleton"></div>
      }
    } @else if (error()) {
      <div class="error" role="alert">
        <p>{{ error() }}</p>
        <button class="btn secondary" (click)="refresh.emit()">Retry</button>
      </div>
    } @else {
      <div class="list">
        @for (item of filtered(); track item.id) {
          <button
            class="item"
            type="button"
            [class.selected]="item.id === selectedId()"
            [attr.aria-current]="item.id === selectedId() ? 'true' : null"
            (click)="selected.emit(item)"
          >
            <div>
              <strong>{{ title(item) }}</strong
              ><span class="muted"
                >{{ item.pointCount }} prayer points ·
                {{ scripture(item.primaryScripture) }}</span
              ><br /><small>{{
                item.theme || item.category || "Prayer collection"
              }}</small>
            </div>
            <div class="meta">
              <small class="muted">{{ relative(item.updatedAt) }}</small
              ><span class="badge">{{ status(item.status) }}</span
              ><b>v{{ item.revision }}</b>
            </div>
          </button>
        } @empty {
          <div class="empty">
            <b>No prayer collections yet.</b>
            <p class="muted">
              Create your first prayer collection from the brief.
            </p>
          </div>
        }
      </div>
    }
  </section>`,
})
export class PrayerRecentWorkComponent {
  readonly items = input.required<readonly PrayerSummary[]>();
  readonly selectedId = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly selected = output<PrayerSummary>();
  readonly refresh = output<void>();
  readonly query = signal("");
  readonly category = signal("");
  readonly categories = PRAYER_CATEGORIES;
  readonly filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.items().filter(
      (i) =>
        (!this.category() || i.category === this.category()) &&
        (!q ||
          `${i.title} ${i.theme} ${formatScripture(i.primaryScripture)}`
            .toLowerCase()
            .includes(q)),
    );
  });
  title(i: PrayerSummary) {
    return prayerTitle({
      title: i.title || "",
      theme: i.theme || "",
      category: i.category || "Intercession",
    });
  }
  scripture = formatScripture;
  status(s: PrayerStatus) {
    return s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  }
  relative(value: string) {
    const mins = Math.max(
      0,
      Math.round((Date.now() - new Date(value).getTime()) / 60000),
    );
    return mins < 1
      ? "Updated just now"
      : mins < 60
        ? `Updated ${mins}m ago`
        : mins < 1440
          ? `Updated ${Math.floor(mins / 60)}h ago`
          : `Updated ${new Date(value).toLocaleDateString()}`;
  }
}
