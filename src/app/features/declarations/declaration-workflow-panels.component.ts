import { Component, input, output, signal } from "@angular/core";
import { DatePipe } from "@angular/common";
import type {
  DeclarationApproval,
  DeclarationStatus,
  DeclarationTimelineEvent,
  DeclarationVersion,
} from "./declaration.models";
import { statusLabel } from "./declaration.models";
@Component({
  selector: "app-declaration-timeline",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      section {
        padding: 1.3rem;
      }
      .event {
        border-left: 2px solid #d9cff3;
        padding: 0 0 1rem 1rem;
      }
      .event p {
        margin: 0.2rem 0;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Workflow timeline</p>
    <h2>Activity</h2>
    @if (loading()) {
      <p>Loading timeline…</p>
    } @else if (!events().length) {
      <p class="muted">No workflow activity yet.</p>
    }
    @for (e of events(); track e.id) {
      <div class="event">
        <b>{{ e.label }}</b>
        <p>{{ e.detail }}</p>
        <small class="muted"
          >{{ e.actorName }} · {{ e.occurredAt | date: "medium" }}</small
        >
      </div>
    }
  </section>`,
})
export class DeclarationTimelineComponent {
  events = input.required<readonly DeclarationTimelineEvent[]>();
  loading = input(false);
}
@Component({
  selector: "app-declaration-version-history",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      section {
        padding: 1.3rem;
      }
      .version {
        display: flex;
        gap: 1rem;
        padding: 0.8rem 0;
        border-bottom: 1px solid var(--line);
      }
      .version input {
        align-self: start;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Version history</p>
    <h2>Saved versions</h2>
    @if (loading()) {
      <p>Loading versions…</p>
    } @else if (!versions().length) {
      <p class="muted">No versions yet.</p>
    }
    @for (v of versions(); track v.id) {
      <label class="version"
        ><input
          type="checkbox"
          [checked]="selected().includes(v.id)"
          (change)="toggle(v.id)"
        /><span
          ><b>v{{ v.number }}</b> ·
          <span class="badge">{{ v.approvalStatus }}</span
          ><br />{{ v.changeSummary || "Version created" }}<br /><small
            class="muted"
            >{{ v.createdByName }} · {{ v.createdAt | date: "medium" }}</small
          ></span
        ></label
      >
    }
    <button
      class="btn secondary"
      [disabled]="selected().length !== 2"
      (click)="compare.emit(selected())"
    >
      Compare selected
    </button>
    @if (changes().length) {
      <h3>Changes</h3>
      <ul>
        @for (c of changes(); track c) {
          <li>{{ c }}</li>
        }
      </ul>
    }
  </section>`,
})
export class DeclarationVersionHistoryComponent {
  versions = input.required<readonly DeclarationVersion[]>();
  loading = input(false);
  changes = input<readonly string[]>([]);
  compare = output<readonly string[]>();
  selected = signal<string[]>([]);
  toggle(id: string) {
    this.selected.update((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length < 2
          ? [...s, id]
          : [s[1], id],
    );
  }
}
@Component({
  selector: "app-declaration-approval-panel",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      section {
        padding: 1.3rem;
      }
      .detail {
        background: #f7f4ff;
        border-radius: 12px;
        padding: 1rem;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Review / approval</p>
    <h2>{{ label(status()) }}</h2>
    @if (approval(); as a) {
      <div class="detail">
        <p><b>Reviewer</b><br />{{ a.reviewerName || "Not assigned" }}</p>
        @if (a.reason) {
          <p><b>Reason</b><br />{{ a.reason }}</p>
        }
        @if (a.comments) {
          <p><b>Comments</b><br />{{ a.comments }}</p>
        }
        @if (a.versionNumber) {
          <p><b>Revision</b><br />v{{ a.versionNumber }}</p>
        }
        @if (a.reviewedAt) {
          <p><b>Date</b><br />{{ a.reviewedAt | date: "medium" }}</p>
        }
      </div>
    }
    @if (status() === "version_ready") {
      <button class="btn" [disabled]="busy()" (click)="submit.emit()">
        Submit for review
      </button>
    }
    @if (status() === "approved") {
      <p>Approved declarations are protected from in-place edits.</p>
      <button class="btn" [disabled]="busy()" (click)="newRevision.emit()">
        Create new revision
      </button>
    }
  </section>`,
})
export class DeclarationApprovalPanelComponent {
  approval = input<DeclarationApproval | null>(null);
  status = input.required<DeclarationStatus>();
  busy = input(false);
  submit = output<void>();
  newRevision = output<void>();
  label = statusLabel;
}
