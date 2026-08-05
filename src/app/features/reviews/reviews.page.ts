import { Component, computed, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

type ReviewType =
  | "Theme"
  | "Sermon"
  | "Prayer"
  | "Declaration"
  | "Flyer"
  | "Video"
  | "Social Post";
interface Review {
  readonly id: number;
  readonly title: string;
  readonly type: ReviewType;
  readonly owner: string;
  readonly assignee: string;
  readonly priority: "Low" | "Normal" | "High";
  readonly due: string;
  readonly status: string;
  readonly publishingAuth: string;
}
interface Audit {
  readonly actor: string;
  readonly organization: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly action: string;
  readonly summary: string;
}
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .layout {
        grid-template-columns: 380px 1fr;
      }
      .filters,
      .actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .review,
      .comment,
      .audit {
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 12px;
        margin-bottom: 0.7rem;
      }
      .review {
        cursor: pointer;
      }
      .review.active {
        border-color: var(--violet);
        background: #f7f4ff;
      }
      .compare {
        grid-template-columns: 1fr 1fr;
      }
      .version {
        background: #fafafa;
        border-left: 3px solid var(--violet);
        padding: 1rem;
      }
      .inline {
        background: #fff8e8;
        border-radius: 8px;
        padding: 0.3rem 0.45rem;
      }
      @media (max-width: 850px) {
        .layout,
        .compare {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<p class="eyebrow">Governance</p>
    <h1>Review & approval center</h1>
    <p class="muted">
      Content approval and social publishing authorization are handled
      independently.
    </p>
    <form class="card filters" [formGroup]="filters">
      <div class="field">
        <label>Type</label
        ><select formControlName="type">
          <option>All</option>
          <option>Theme</option>
          <option>Sermon</option>
          <option>Prayer</option>
          <option>Declaration</option>
          <option>Flyer</option>
          <option>Video</option>
          <option>Social Post</option>
        </select>
      </div>
      <div class="field">
        <label>Assignee</label><input formControlName="assignee" />
      </div>
      <div class="field">
        <label>Priority</label
        ><select formControlName="priority">
          <option>All</option>
          <option>High</option>
          <option>Normal</option>
          <option>Low</option>
        </select>
      </div>
      <div class="field">
        <label>Due by</label><input type="date" formControlName="due" />
      </div>
    </form>
    <div class="grid layout" style="margin-top:1rem">
      <aside class="card">
        <h2>Permission-aware queue</h2>
        @for (r of filteredQueue(); track r.id) {
          <article
            class="review"
            [class.active]="selected()?.id === r.id"
            tabindex="0"
            (click)="selected.set(r)"
            (keydown.enter)="selected.set(r)"
          >
            <span class="badge">{{ r.type }} · {{ r.priority }}</span>
            <h3>{{ r.title }}</h3>
            <p class="muted">
              Owner {{ r.owner }} · Assigned {{ r.assignee }} · Due {{ r.due }}
            </p>
            <small
              >Content: {{ r.status }} · Publishing:
              {{ r.publishingAuth }}</small
            >
          </article>
        } @empty {
          <div class="empty">No review items match the current filters.</div>
        }
      </aside>
      <main class="card">
        @if (selected(); as item) {
          <span class="badge">{{ item.status }}</span>
          <h2>{{ item.title }}</h2>
          <p>
            <b>Assignment:</b> {{ item.assignee }} · <b>Priority:</b>
            {{ item.priority }} · <b>Due:</b> {{ item.due }}
          </p>
          <p>
            <b>Publishing authorization:</b> {{ item.publishingAuth }}. Approval
            here confirms editorial/theological readiness only.
          </p>
          <div class="grid compare" aria-label="Version comparison">
            <section class="version">
              <h3>Previous version</h3>
              <p>
                Original wording with scripture references and ministry notes.
              </p>
            </section>
            <section class="version">
              <h3>Proposed version</h3>
              <p>
                Updated wording with
                <span class="inline">inline comment anchor</span>, safer
                language, and final-format preview.
              </p>
            </section>
          </div>
          <form class="grid" style="margin-top:1rem" [formGroup]="decision">
            <div class="field">
              <label for="comment">Comment, mention, or inline note</label
              ><textarea
                id="comment"
                rows="4"
                formControlName="comment"
                placeholder="Give clear, actionable feedback and @mention teammates"
              ></textarea>
            </div>
            <div class="field">
              <label for="reason">Policy reason</label
              ><input
                id="reason"
                formControlName="reason"
                placeholder="Required for rejection or request changes"
              />
            </div>
            <div class="field">
              <label for="assign">Assign to</label
              ><input id="assign" formControlName="assign" />
            </div>
          </form>
          <div class="actions">
            <button class="btn secondary" type="button" (click)="assign(item)">
              Assign</button
            ><button
              class="btn secondary"
              type="button"
              (click)="act('Changes requested')"
            >
              Request changes</button
            ><button
              class="btn secondary"
              type="button"
              (click)="act('Rejected')"
            >
              Reject</button
            ><button class="btn" type="button" (click)="act('Approved')">
              Approve content
            </button>
          </div>
          <h3>Comments</h3>
          @for (comment of comments(); track comment) {
            <div class="comment">{{ comment }}</div>
          }
          <h3>Immutable audit history</h3>
          @for (entry of audits(); track entry.correlationId) {
            <div class="audit">
              <b>{{ entry.action }}</b>
              <p>
                {{ entry.actor }} · {{ entry.organization }} ·
                {{ entry.timestamp }}
              </p>
              <p>{{ entry.summary }}</p>
              <small>{{ entry.correlationId }}</small>
            </div>
          }
        } @else {
          <div class="empty">Select an item to start reviewing.</div>
        }
      </main>
    </div>`,
})
export class ReviewsPage {
  readonly filters = new FormGroup({
    type: new FormControl("All", { nonNullable: true }),
    assignee: new FormControl("", { nonNullable: true }),
    priority: new FormControl("All", { nonNullable: true }),
    due: new FormControl("", { nonNullable: true }),
  });
  readonly decision = new FormGroup({
    comment: new FormControl("", { nonNullable: true }),
    reason: new FormControl("", { nonNullable: true }),
    assign: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly queue = signal<Review[]>([
    {
      id: 1,
      title: "August: Enlarged by Grace",
      type: "Theme",
      owner: "Pastor Ama",
      assignee: "Reviewer",
      priority: "High",
      due: "2026-08-07",
      status: "Awaiting Approval",
      publishingAuth: "Not requested",
    },
    {
      id: 2,
      title: "The Authority of the Believer",
      type: "Sermon",
      owner: "Kwame Mensah",
      assignee: "Senior Pastor",
      priority: "Normal",
      due: "2026-08-09",
      status: "Awaiting Approval",
      publishingAuth: "Not applicable",
    },
    {
      id: 3,
      title: "Youth Encounter",
      type: "Flyer",
      owner: "Media Team",
      assignee: "Reviewer",
      priority: "Normal",
      due: "2026-08-10",
      status: "Changes requested",
      publishingAuth: "Separate social approval required",
    },
    {
      id: 4,
      title: "Sunday reel",
      type: "Social Post",
      owner: "Publisher",
      assignee: "Publisher",
      priority: "High",
      due: "2026-08-06",
      status: "Awaiting Approval",
      publishingAuth: "Pending publisher authorization",
    },
  ]);
  readonly selected = signal<Review | null>(this.queue()[0] ?? null);
  readonly comments = signal<string[]>([
    "@MediaTeam please verify the flyer crop before approval.",
  ]);
  readonly audits = signal<Audit[]>([
    {
      actor: "Reviewer",
      organization: "Sanctuary Chapel",
      timestamp: "2026-08-05T08:30:00Z",
      correlationId: "corr-review-001",
      action: "Review opened",
      summary:
        "Safe summary recorded without token, secret, or full-content leakage.",
    },
  ]);
  readonly filteredQueue = computed(() => {
    const f = this.filters.getRawValue();
    return this.queue().filter(
      (r) =>
        (f.type === "All" || r.type === f.type) &&
        (f.priority === "All" || r.priority === f.priority) &&
        (!f.assignee ||
          r.assignee.toLowerCase().includes(f.assignee.toLowerCase())) &&
        (!f.due || r.due <= f.due),
    );
  });
  assign(item: Review) {
    const assignee = this.decision.controls.assign.value || item.assignee;
    this.record("Assigned", `${item.title} assigned to ${assignee}.`);
  }
  act(status: string) {
    const item = this.selected();
    if (!item) return;
    if (
      (status === "Rejected" || status === "Changes requested") &&
      !this.decision.controls.reason.value.trim()
    ) {
      this.comments.update((c) => [
        "A policy reason is required before this action.",
        ...c,
      ]);
      return;
    }
    if (item.owner === "Current user" && status === "Approved") {
      this.comments.update((c) => [
        "Self-approval is prohibited by organization policy.",
        ...c,
      ]);
      return;
    }
    this.record(status, `${item.title} moved to ${status}.`);
    this.queue.update((q) => q.filter((x) => x.id !== item.id));
    this.selected.set(this.queue()[0] ?? null);
  }
  private record(action: string, summary: string) {
    this.audits.update((a) => [
      {
        actor: "Current user",
        organization: "Sanctuary Chapel",
        timestamp: new Date().toISOString(),
        correlationId: `corr-review-${a.length + 1}`,
        action,
        summary,
      },
      ...a,
    ]);
    const comment = this.decision.controls.comment.value.trim();
    if (comment) this.comments.update((c) => [comment, ...c]);
  }
}
