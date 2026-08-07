import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import type { ApiProblem, ThemeApproval } from "./theme.models";
@Component({
  selector: "app-theme-approval-panel",
  standalone: true,
  imports: [DatePipe],
  template: `<section class="card">
    <p class="eyebrow">Review & approval</p>
    <h2>{{ label() }}</h2>
    @if (error()) {
      <p class="error">{{ error()?.message }}</p>
    }
    @if (approval(); as a) {
      @if (a.status === "changes_requested") {
        <div class="error">
          <b>Changes requested</b>
          <p>{{ a.reason }}</p>
          <p>{{ a.comments }}</p>
          <small>{{ a.reviewer }} · {{ a.timestamp | date: "medium" }}</small>
        </div>
      }
      @if (a.status === "approved") {
        <p>
          <b>Approved revision {{ a.approvedRevision }}</b>
        </p>
        <p>{{ a.reviewer }} · {{ a.timestamp | date: "medium" }}</p>
      }
    }
    @if (canSubmit()) {
      <button class="btn" type="button" (click)="submit.emit()">
        Submit for Review
      </button>
    }
    @if (approved()) {
      <button class="btn secondary" type="button" (click)="newRevision.emit()">
        Create New Revision
      </button>
    }
  </section>`,
})
export class ThemeApprovalPanelComponent {
  readonly approval = input<ThemeApproval | null>();
  readonly workflowStatus = input("draft");
  readonly error = input<ApiProblem | null>();
  readonly submit = output();
  readonly newRevision = output();
  canSubmit() {
    return this.workflowStatus() === "version_ready";
  }
  approved() {
    return (
      this.workflowStatus() === "approved" ||
      this.approval()?.status === "approved"
    );
  }
  label() {
    return (
      (
        {
          pending: "Pending",
          in_review: "In Review",
          changes_requested: "Changes Requested",
          approved: "Approved",
          rejected: "Rejected",
        } as Record<string, string>
      )[this.approval()?.status || ""] || "Not submitted"
    );
  }
}
