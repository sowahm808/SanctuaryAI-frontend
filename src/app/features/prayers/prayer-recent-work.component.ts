import { Component, computed, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  PRAYER_CATEGORIES,
  type PrayerStatus,
  type PrayerSummaryView,
} from "./prayer.models";
@Component({
  selector: "app-prayer-recent-work",
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      .head,
      .filters,
      .meta {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .head {
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
        gap: 0.25rem;
      }
      .item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 1rem;
        width: 100%;
        border: 0;
        border-bottom: 1px solid
          color-mix(in srgb, var(--line) 65%, transparent);
        border-radius: 12px;
        background: transparent;
        text-align: left;
        padding: 0.85rem;
        transition: 0.15s;
      }
      .item:hover {
        background: #f7f5fc;
      }
      .item:focus-visible {
        outline: 2px solid var(--violet);
        outline-offset: 2px;
      }
      .item.selected {
        background: #f0ecfb;
        box-shadow: inset 3px 0 var(--violet);
      }
      .item strong {
        display: block;
        color: var(--ink);
        font-size: 1rem;
        margin-bottom: 0.2rem;
      }
      .item-left {
        min-width: 0;
      }
      .theme {
        display: block;
        margin-bottom: 0.35rem;
      }
      .content-meta {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .meta {
        justify-content: flex-end;
        flex-wrap: wrap;
        max-width: 17rem;
      }
      .version {
        color: #432a91;
        font-size: 0.8rem;
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
          grid-template-columns: 1fr;
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
        }</select
      ><select aria-label="Filter status" [(ngModel)]="statusFilter">
        <option value="">All statuses</option>
        <option value="draft">Draft</option>
        <option value="pending_approval">Awaiting review</option>
        <option value="changes_requested">Changes requested</option>
        <option value="approved">Approved</option>
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
            <div class="item-left">
              <strong>{{ item.title }}</strong>
              @if (item.theme) {
                <small class="muted theme">{{ item.theme }}</small>
              }
              <div class="content-meta muted">
                @if (item.prayerPointCount !== undefined) {
                  <small>{{ item.prayerPointCount }} prayer points</small>
                }
                @if (
                  item.prayerPointCount !== undefined && item.scriptureLabel
                ) {
                  <small aria-hidden="true">·</small>
                }
                @if (item.scriptureLabel) {
                  <small>{{ item.scriptureLabel }}</small>
                }
                <small>{{ item.categoryLabel }}</small>
              </div>
            </div>
            <div class="meta">
              <small class="muted">{{ item.updatedLabel }}</small
              ><span class="badge">{{ item.statusLabel }}</span>
              @if (item.versionLabel) {
                <b class="version">{{ item.versionLabel }}</b>
              }
            </div>
          </button>
        } @empty {
          <div class="empty">
            @if (items().length) {
              <b>No prayer collections match your filters.</b>
              <p>
                <button
                  class="btn secondary"
                  type="button"
                  (click)="clearFilters()"
                >
                  Clear filters
                </button>
              </p>
            } @else {
              <b>No prayer collections yet.</b>
              <p class="muted">
                Create your first collection using the brief on the left.
              </p>
            }
          </div>
        }
      </div>
    }
  </section>`,
})
export class PrayerRecentWorkComponent {
  readonly items = input.required<readonly PrayerSummaryView[]>();
  readonly selectedId = input<string | null>(null);
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly selected = output<PrayerSummaryView>();
  readonly refresh = output<void>();
  readonly query = signal("");
  readonly category = signal("");
  readonly statusFilter = signal<PrayerStatus | "">("");
  readonly categories = PRAYER_CATEGORIES;
  readonly filtered = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return this.items().filter(
      (i) =>
        (!this.category() || i.category === this.category()) &&
        (!this.statusFilter() || i.status === this.statusFilter()) &&
        (!q ||
          `${i.title} ${i.theme || ""} ${i.scriptureLabel || ""} ${i.categoryLabel}`
            .toLocaleLowerCase()
            .includes(q)),
    );
  });
  clearFilters() {
    this.query.set("");
    this.category.set("");
    this.statusFilter.set("");
  }
}
