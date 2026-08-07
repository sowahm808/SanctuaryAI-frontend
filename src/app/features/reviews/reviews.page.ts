import { HttpErrorResponse } from "@angular/common/http";
import { Component, DestroyRef, OnInit, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { debounceTime, finalize } from "rxjs";
import { ReviewContentPreviewComponent } from "./review-content-preview.component";
import type {
  ReviewContentType,
  ReviewDetail,
  ReviewQueueFilters,
  ReviewQueueItem,
} from "./reviews.models";
import { ReviewsService } from "./reviews.service";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, ReviewContentPreviewComponent],
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
        min-width: 0;
      }
      .notice {
        padding: 0.8rem;
        border-radius: 8px;
        margin: 0.8rem 0;
        background: #eef7ff;
      }
      .error {
        background: #fff0f0;
        color: #8b1a1a;
      }
      button:disabled {
        opacity: 0.55;
        cursor: not-allowed;
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
    @if (error()) {
      <div class="notice error" role="alert">
        {{ error() }} <button type="button" (click)="loadQueue()">Retry</button>
      </div>
    }
    @if (success()) {
      <div class="notice" role="status">{{ success() }}</div>
    }
    <form class="card filters" [formGroup]="filters">
      <div class="field">
        <label>Type</label
        ><select formControlName="type">
          <option value="">All</option>
          <option value="theme">Theme</option>
          <option value="sermon">Sermon</option>
          <option value="prayer">Prayer</option>
          <option value="declaration">Declaration</option>
          <option value="flyer">Flyer</option>
          <option value="video">Video</option>
          <option value="social_post">Social Post</option>
        </select>
      </div>
      <div class="field">
        <label>Assignee</label><input formControlName="assignee" />
      </div>
      <div class="field">
        <label>Priority</label
        ><select formControlName="priority">
          <option value="">All</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div class="field">
        <label>Due by</label><input type="date" formControlName="dueAt" />
      </div>
    </form>
    <div class="grid layout" style="margin-top:1rem">
      <aside class="card">
        <h2>Permission-aware queue</h2>
        @if (loadingQueue()) {
          <p class="muted" aria-live="polite">Loading review queue…</p>
        } @else {
          @for (r of queue(); track r.id) {
            <article
              class="review"
              [class.active]="selectedId() === r.id"
              tabindex="0"
              (click)="select(r.id)"
              (keydown.enter)="select(r.id)"
            >
              <span class="badge">{{ r.contentType }} · {{ r.priority }}</span>
              <h3>{{ r.title }}</h3>
              <p class="muted">
                Owner {{ r.ownerName }} · Assigned
                {{ r.assigneeName || "Unassigned" }} · Due
                {{ r.dueAt || "Not set" }}
              </p>
              <small
                >Content: {{ r.status }} · Publishing:
                {{ r.publishingAuthorizationStatus || "Not requested" }}</small
              >
            </article>
          } @empty {
            <div class="empty">There is no content awaiting your review.</div>
          }
        }
      </aside>
      <main class="card">
        @if (loadingDetail()) {
          <p class="muted" aria-live="polite">Loading review details…</p>
        } @else if (selected(); as item) {
          <span class="badge">{{ item.status }}</span>
          <h2>{{ item.title }}</h2>
          <p>
            <b>Assignment:</b> {{ item.assigneeName || "Unassigned" }} ·
            <b>Priority:</b> {{ item.priority }} · <b>Due:</b>
            {{ item.dueAt || "Not set" }}
          </p>
          <div class="grid compare" aria-label="Version comparison">
            <section class="version">
              <h3>Previous version</h3>
              @if (item.previousVersion; as version) {
                <p class="muted">
                  Version {{ version.versionNumber }} ·
                  {{ version.createdAt }} ·
                  {{ version.createdByName || "Unknown author" }}
                </p>
                <app-review-content-preview
                  [contentType]="item.contentType"
                  [content]="version.content"
                />
              } @else {
                <p>
                  No previous version exists. This is the initial submission.
                </p>
              }
            </section>
            <section class="version">
              <h3>Proposed version</h3>
              <p class="muted">
                Version {{ item.proposedVersion.versionNumber }} ·
                {{ item.proposedVersion.createdAt }} ·
                {{ item.proposedVersion.createdByName || "Unknown author" }}
              </p>
              <app-review-content-preview
                [contentType]="item.contentType"
                [content]="item.proposedVersion.content"
              />
            </section>
          </div>
          <form class="grid" style="margin-top:1rem" [formGroup]="decision">
            <div class="field">
              <label for="comment">Comment</label
              ><textarea
                id="comment"
                rows="4"
                formControlName="comment"
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
            @if (item.allowedActions.assign) {
              <div class="field">
                <label for="assign">Assign to</label
                ><select id="assign" formControlName="assigneeId">
                  <option value="">Select an eligible reviewer</option>
                  @for (reviewer of reviewers(); track reviewer.id) {
                    <option [value]="reviewer.id">{{ reviewer.name }}</option>
                  }
                </select>
              </div>
            }
          </form>
          <div class="actions">
            @if (item.allowedActions.assign) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="submitting()"
                (click)="assign()"
              >
                Assign
              </button>
            }
            @if (item.allowedActions.requestChanges) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="submitting()"
                (click)="decide('requestChanges')"
              >
                Request changes
              </button>
            }
            @if (item.allowedActions.reject) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="submitting()"
                (click)="decide('reject')"
              >
                Reject
              </button>
            }
            @if (item.allowedActions.approve) {
              <button
                class="btn"
                type="button"
                [disabled]="submitting()"
                (click)="decide('approve')"
              >
                Approve content
              </button>
            }
            @if (item.allowedActions.comment) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="
                  submitting() || !decision.controls.comment.value.trim()
                "
                (click)="addComment()"
              >
                Add comment
              </button>
            }
          </div>
          <h3>Comments</h3>
          @for (comment of item.comments; track comment.id) {
            <div class="comment">
              <b>{{ comment.authorName }}</b> · {{ comment.createdAt }}
              <p>{{ comment.body }}</p>
            </div>
          } @empty {
            <p class="muted">No comments yet.</p>
          }
          <h3>Immutable audit history</h3>
          @for (entry of item.auditHistory; track entry.id) {
            <div class="audit">
              <b>{{ entry.action }}</b>
              <p>{{ entry.actorName }} · {{ entry.timestamp }}</p>
              <p>{{ entry.summary }}</p>
              @if (entry.correlationId) {
                <small>{{ entry.correlationId }}</small>
              }
            </div>
          } @empty {
            <p class="muted">No audit events returned.</p>
          }
        } @else {
          <div class="empty">Select an item to start reviewing.</div>
        }
      </main>
    </div>`,
})
export class ReviewsPage implements OnInit {
  private readonly reviews = inject(ReviewsService);
  private readonly destroyRef = inject(DestroyRef);
  readonly queue = signal<readonly ReviewQueueItem[]>([]);
  readonly selectedId = signal<string | null>(null);
  readonly selected = signal<ReviewDetail | null>(null);
  readonly reviewers = signal<readonly { id: string; name: string }[]>([]);
  readonly loadingQueue = signal(false);
  readonly loadingDetail = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly filters = new FormGroup({
    type: new FormControl("", { nonNullable: true }),
    assignee: new FormControl("", { nonNullable: true }),
    priority: new FormControl("", { nonNullable: true }),
    dueAt: new FormControl("", { nonNullable: true }),
  });
  readonly decision = new FormGroup({
    comment: new FormControl("", { nonNullable: true }),
    reason: new FormControl("", { nonNullable: true }),
    assigneeId: new FormControl("", {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  ngOnInit(): void {
    this.loadQueue();
    this.filters.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadQueue());
    this.reviews
      .getEligibleReviewers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (p) => this.reviewers.set(p.items),
        error: () => undefined,
      });
  }
  loadQueue(): void {
    this.loadingQueue.set(true);
    this.error.set(null);
    const f = this.filters.getRawValue();
    const filters: ReviewQueueFilters = {
      contentType: (f.type || undefined) as ReviewContentType | undefined,
      assignee: f.assignee || undefined,
      priority: (f.priority || undefined) as ReviewQueueFilters["priority"],
      dueAt: f.dueAt || undefined,
    };
    this.reviews
      .getReviewQueue(filters)
      .pipe(
        finalize(() => this.loadingQueue.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this.queue.set(page.items);
          const id = page.items.some((x) => x.id === this.selectedId())
            ? this.selectedId()
            : (page.items[0]?.id ?? null);
          if (id) this.select(id);
          else {
            this.selectedId.set(null);
            this.selected.set(null);
          }
        },
        error: (e) => this.error.set(this.message(e)),
      });
  }
  select(id: string): void {
    if (id === this.selectedId() && this.selected()) return;
    this.selectedId.set(id);
    this.loadingDetail.set(true);
    this.error.set(null);
    this.reviews
      .getReviewById(id)
      .pipe(
        finalize(() => this.loadingDetail.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => this.selected.set(detail),
        error: (e) => {
          this.selected.set(null);
          this.error.set(this.message(e));
        },
      });
  }
  decide(action: "approve" | "reject" | "requestChanges"): void {
    const item = this.selected();
    if (!item || !item.allowedActions[action]) return;
    const reason = this.decision.controls.reason.value.trim();
    if (action !== "approve" && !reason) {
      this.error.set("A reason is required for this decision.");
      return;
    }
    this.submit(
      this.reviews[action](item.id, {
        reason: reason || undefined,
        comment: this.decision.controls.comment.value.trim() || undefined,
      }),
      `Review ${action === "requestChanges" ? "changes requested" : action + "d"}.`,
      true,
    );
  }
  assign(): void {
    const item = this.selected();
    if (
      !item?.allowedActions.assign ||
      this.decision.controls.assigneeId.invalid
    ) {
      this.error.set("Select an eligible reviewer.");
      return;
    }
    this.submit(
      this.reviews.assign(item.id, {
        assigneeId: this.decision.controls.assigneeId.value,
      }),
      "Review assigned.",
      false,
    );
  }
  addComment(): void {
    const item = this.selected();
    const body = this.decision.controls.comment.value.trim();
    if (!item?.allowedActions.comment || !body) return;
    this.submitting.set(true);
    this.error.set(null);
    this.reviews
      .addComment(item.id, { body })
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.decision.controls.comment.reset();
          this.success.set("Comment saved.");
          this.reloadDetail();
        },
        error: (e) => this.error.set(this.message(e)),
      });
  }
  private submit(
    request: ReturnType<ReviewsService["approve"]>,
    success: string,
    refreshQueue: boolean,
  ): void {
    this.submitting.set(true);
    this.error.set(null);
    this.success.set(null);
    request
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (detail) => {
          this.selected.set(detail);
          this.decision.controls.comment.reset();
          this.decision.controls.reason.reset();
          this.success.set(success);
          if (refreshQueue) this.loadQueue();
        },
        error: (e) => {
          this.error.set(this.message(e));
          if (e instanceof HttpErrorResponse && e.status === 409)
            this.reloadDetail();
        },
      });
  }
  private reloadDetail(): void {
    const id = this.selectedId();
    if (id) {
      this.selectedId.set(null);
      this.select(id);
    }
  }
  private message(error: unknown): string {
    if (!(error instanceof HttpErrorResponse))
      return "The review service is unavailable. Please try again.";
    const body = error.error as { message?: string } | null;
    const fallback: Record<number, string> = {
      401: "Your session has expired. Please sign in again.",
      403: "You do not have permission to perform this review action.",
      404: "This review no longer exists.",
      409: "This review changed on the server. Its latest state has been loaded.",
      422: "The review action was not valid. Check the supplied details.",
    };
    return (
      body?.message ||
      fallback[error.status] ||
      "The review service could not complete the request."
    );
  }
}
