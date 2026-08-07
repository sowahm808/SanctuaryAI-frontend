import { DatePipe } from "@angular/common";
import { Component, input } from "@angular/core";
import type { PrayerTimelineEvent } from "./prayer.models";
@Component({
  selector: "app-prayer-timeline",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      .timeline {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      .timeline li {
        position: relative;
        padding: 0 0 1rem 1.5rem;
        border-left: 2px solid #ded7f2;
      }
      .timeline li:before {
        content: "";
        position: absolute;
        left: -6px;
        top: 3px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--violet);
      }
      .timeline p {
        margin: 0.25rem 0;
      }
      .empty {
        color: var(--muted);
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Activity</p>
    <h2>Workflow timeline</h2>
    @if (loading()) {
      <p>Loading timeline…</p>
    } @else {
      <ol class="timeline">
        @for (event of events(); track event.id) {
          <li>
            <b>{{ event.label }}</b>
            <p class="muted">{{ event.detail }}</p>
            <small
              >{{ event.actorName || "SanctuaryAI" }} ·
              {{ event.occurredAt | date: "medium" }}</small
            >
          </li>
        } @empty {
          <p class="empty">
            Timeline activity will appear after the draft is saved.
          </p>
        }
      </ol>
    }
  </section>`,
})
export class PrayerTimelineComponent {
  readonly events = input.required<readonly PrayerTimelineEvent[]>();
  readonly loading = input(false);
}
