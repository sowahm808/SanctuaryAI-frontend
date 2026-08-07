import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import type { PrayerApproval, PrayerStatus } from "./prayer.models";
@Component({
  selector: "app-prayer-approval-panel",
  standalone: true,
  imports: [DatePipe],
  styles: [
    `
      .panel {
        border-left: 4px solid var(--violet);
      }
      .head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .review-note {
        background: #fff7ed;
        border-radius: 10px;
        padding: 0.8rem;
        margin: 0.8rem 0;
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
    `,
  ],
  template: `<section class="card panel">
    <div class="head">
      <div>
        <p class="eyebrow">Governance</p>
        <h2>Review & approval</h2>
      </div>
      @if (approval(); as value) {
        <span class="badge">{{ label(value.status) }}</span>
      }
    </div>
    @if (approval(); as value) {
      @if (value.status === "changes_requested") {
        <div class="review-note">
          <b>Changes requested</b>
          <p>{{ value.reason }}</p>
          <p>{{ value.comments }}</p>
          <small>Reviewer: {{ value.reviewerName }}</small>
        </div>
      }
      @if (value.status === "approved") {
        <p>
          <b>Approved v{{ value.versionNumber }}</b
          ><br />{{ value.reviewerName }} ·
          {{ value.reviewedAt | date: "medium" }}
        </p>
      }
      @if (value.status === "pending") {
        <p class="muted">This exact version is awaiting ministry review.</p>
      }
    } @else {
      <p class="muted">Generate a version before requesting review.</p>
    }
    <div class="actions">
      @if (status() === "version_ready" || status() === "changes_requested") {
        <button
          class="btn"
          type="button"
          [disabled]="busy()"
          (click)="submit.emit()"
        >
          Submit for review
        </button>
      }
      @if (status() === "approved") {
        <button
          class="btn secondary"
          type="button"
          [disabled]="busy()"
          (click)="newRevision.emit()"
        >
          Create new revision
        </button>
      }
    </div>
  </section>`,
})
export class PrayerApprovalPanelComponent {
  readonly approval = input<PrayerApproval | null>(null);
  readonly status = input.required<PrayerStatus>();
  readonly busy = input(false);
  readonly submit = output<void>();
  readonly newRevision = output<void>();
  label(s: PrayerApproval["status"]) {
    return s.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  }
}
