import { DatePipe } from "@angular/common";
import { Component, input } from "@angular/core";
import type { PrayerVersion } from "./prayer.models";
@Component({
  selector: "app-prayer-version-history",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      .version {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--line);
      }
      .version:last-child {
        border: 0;
      }
      .meta {
        text-align: right;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Revision control</p>
    <h2>Version history</h2>
    @for (version of versions(); track version.id) {
      <div class="version">
        <div>
          <b>v{{ version.number }}</b
          ><br /><small>{{ version.createdByName }}</small>
        </div>
        <div class="meta">
          <span class="badge">{{ version.reviewStatus }}</span
          ><br /><small class="muted">{{
            version.createdAt | date: "medium"
          }}</small>
        </div>
      </div>
    } @empty {
      <p class="muted">Generated versions will be preserved here.</p>
    }
  </section>`,
})
export class PrayerVersionHistoryComponent {
  readonly versions = input.required<readonly PrayerVersion[]>();
}
