import { Component, input } from "@angular/core";
import { DatePipe } from "@angular/common";
import type { ApiProblem, ThemeTimelineEvent } from "./theme.models";
@Component({
  selector: "app-theme-timeline",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      :host {
        display: block;
      }
      .timeline {
        list-style: none;
        padding: 0;
        margin: 1rem 0;
      }
      .event {
        position: relative;
        padding: 0 0 1.35rem 2rem;
      }
      .event:before {
        content: "";
        position: absolute;
        left: 0.38rem;
        top: 0.7rem;
        bottom: -0.2rem;
        border-left: 2px solid var(--line);
      }
      .event:last-child:before {
        display: none;
      }
      .dot {
        position: absolute;
        left: 0;
        top: 0.2rem;
        width: 0.85rem;
        height: 0.85rem;
        border-radius: 50%;
        background: var(--violet);
        box-shadow: 0 0 0 4px #eee9fa;
      }
      .failed .dot,
      .cancelled .dot {
        background: var(--danger);
      }
      h3,
      p {
        margin: 0.1rem 0;
      }
      .meta {
        color: var(--muted);
        font-size: 0.8rem;
      }
      .skeleton {
        height: 3.5rem;
        background: #eee;
        border-radius: 8px;
        margin: 0.5rem 0;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Workflow timeline</p>
    <h2>Activity</h2>
    @if (loading()) {
      @for (i of [1, 2, 3]; track i) {
        <div class="skeleton"></div>
      }
    } @else if (error()) {
      <div class="error" role="alert">
        <b>Unable to load timeline.</b>
        <p>{{ error()?.message }}</p>
        @if (error()?.correlationId) {
          <small>Reference: {{ error()?.correlationId }}</small>
        }
      </div>
    } @else {
      <ol class="timeline">
        @for (event of events(); track event.id) {
          <li class="event" [class]="event.state">
            <span class="dot" aria-hidden="true"></span>
            <h3>{{ event.label }}</h3>
            <p class="meta">
              {{ event.timestamp | date: "medium" }}
              @if (event.actor) {
                · {{ event.actor }}
              }
              @if (event.revision) {
                · Revision {{ event.revision }}
              }
            </p>
            @if (event.summary) {
              <p>{{ event.summary }}</p>
            }
          </li>
        } @empty {
          <p class="muted">Activity will appear after this draft is saved.</p>
        }
      </ol>
    }
  </section>`,
})
export class ThemeTimelineComponent {
  readonly events = input<readonly ThemeTimelineEvent[]>([]);
  readonly loading = input(false);
  readonly error = input<ApiProblem | null>(null);
}
