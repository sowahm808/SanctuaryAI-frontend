import { JsonPipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize, switchMap } from "rxjs";
import { AiJobService } from "../../core/ai/ai-job.service";
import type { AsyncJob, EntityId } from "../../models/domain.models";
import { ApprovalService } from "../reviews/approval.service";
import type { ReviewQueueItem } from "../reviews/reviews.models";
import {
  WorkflowService,
  type ContentGenerationResult,
  type ContentWorkflowStatus,
  type WorkflowDraft,
  type WorkflowKind,
} from "./workflow.service";

export interface WorkflowFieldConfig {
  readonly key: string;
  readonly label: string;
  readonly type:
    "text" | "textarea" | "number" | "date" | "select" | "multiselect";
  readonly required: boolean;
  readonly options?: readonly string[];
}
interface WorkflowPageConfig {
  readonly title: string;
  readonly description: string;
  readonly primaryAction: string;
  readonly fields: readonly WorkflowFieldConfig[];
}
const CONFIG: Readonly<Record<WorkflowKind, WorkflowPageConfig>> = {
  themes: {
    title: "Theme generation workspace",
    description:
      "Create a revision, generate alternatives, edit, and submit the exact version for review.",
    primaryAction: "Generate theme",
    fields: [
      field("monthAndYear", "Month and year"),
      field("topic", "Topic"),
      field("mainScripture", "Main scripture"),
      field("supportingScriptures", "Supporting scriptures", "textarea"),
      field("spiritualEmphasis", "Spiritual emphasis", "textarea"),
      field("pastorNotes", "Pastor notes", "textarea", false),
    ],
  },
  "prayer-points": {
    title: "Prayer collection builder",
    description:
      "Create scripture-grounded prayer collections and submit a generated version for review.",
    primaryAction: "Generate prayer points",
    fields: [
      field("quantity", "Quantity", "number"),
      field("theme", "Theme"),
      field("scripture", "Scripture"),
      field("prayerCategory", "Prayer category"),
      field("tone", "Tone"),
    ],
  },
  declarations: {
    title: "Prophetic declaration studio",
    description:
      "Create, revise, generate, and govern declaration versions without overwriting approvals.",
    primaryAction: "Generate declaration",
    fields: [
      field("declarationType", "Declaration type"),
      field("scriptureFoundation", "Scripture foundation"),
      field("tone", "Tone"),
      field("audience", "Audience"),
      field("serviceContext", "Service context", "textarea"),
    ],
  },
};
const STATUS_LABELS: Readonly<Record<ContentWorkflowStatus, string>> = {
  draft: "Draft",
  generating: "Generating",
  version_ready: "Version ready",
  pending_approval: "Awaiting approval",
  in_review: "In review",
  changes_requested: "Changes requested",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  published: "Published",
  failed: "Failed",
  cancelled: "Cancelled",
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, JsonPipe],
  styles: [
    `
      .head,
      .actions,
      .record {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .layout {
        grid-template-columns: minmax(300px, 400px) 1fr;
      }
      .form {
        display: grid;
        gap: 0.9rem;
      }
      .record {
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--line);
      }
      .preview {
        min-height: 170px;
        border: 1px dashed #cfc8e8;
        border-radius: 14px;
        padding: 1rem;
        background: #fbfaff;
      }
      .actions {
        flex-wrap: wrap;
      }
      .error {
        color: #8b1a1a;
      }
      @media (max-width: 900px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .head {
          align-items: start;
          flex-direction: column;
        }
      }
    `,
  ],
  template: ` <header class="head">
      <div>
        <p class="eyebrow">Content workflow</p>
        <h1>{{ config().title }}</h1>
        <p class="muted">{{ config().description }}</p>
      </div>
      <div class="actions">
        <button
          class="btn secondary"
          type="button"
          [disabled]="saving()"
          (click)="saveDraft()"
        >
          {{ saving() ? "Saving…" : "Save draft" }}
        </button>
        <button
          class="btn"
          type="button"
          [disabled]="generating() || saving()"
          (click)="generate()"
        >
          {{ generating() ? "Generating…" : "✦ " + config().primaryAction }}
        </button>
        @if (canSubmitForReview()) {
          <button
            class="btn"
            type="button"
            [disabled]="submittingForReview()"
            (click)="submitForReview()"
          >
            {{ submittingForReview() ? "Submitting…" : "Submit for review" }}
          </button>
        }
        @if (currentJob()?.cancellationSupported) {
          <button
            class="btn secondary"
            type="button"
            [disabled]="cancelling()"
            (click)="cancelJob()"
          >
            Cancel AI job
          </button>
        }
      </div>
    </header>
    <section class="card">
      <b>Status: {{ statusLabel() }}</b>
      @if (currentJob(); as job) {
        <p class="muted">Job {{ job.status }} · {{ job.progress }}%</p>
      }
      @if (workflowError()) {
        <p class="error" role="alert">{{ workflowError() }}</p>
      }
    </section>
    <div class="grid layout">
      <form class="card form" [formGroup]="form" aria-label="Content brief">
        <h2>Brief</h2>
        @for (field of config().fields; track field.key) {
          <div class="field">
            <label [for]="field.key">{{ field.label }}</label>
            @if (field.type === "textarea") {
              <textarea
                [id]="field.key"
                [formControlName]="field.key"
              ></textarea>
            } @else {
              <input
                [id]="field.key"
                [type]="field.type"
                [formControlName]="field.key"
              />
            }
            @if (
              form.controls[field.key].invalid &&
              form.controls[field.key].touched
            ) {
              <small class="error">{{ field.label }} is required.</small>
            }
          </div>
        }
      </form>
      <section class="grid">
        <article class="card">
          <h2>Recent work</h2>
          @if (loading()) {
            <p>Loading…</p>
          } @else if (recordsError()) {
            <div class="error" role="alert">
              <p>{{ recordsError() }}</p>
              <button
                class="btn secondary"
                type="button"
                (click)="loadRecent()"
              >
                Retry
              </button>
            </div>
          } @else {
            @for (record of records(); track record.id) {
              <button type="button" class="record" (click)="select(record)">
                <span
                  ><b>{{ record.title || "Untitled content" }}</b
                  ><br /><small class="muted"
                    >Revision {{ record.revision }} ·
                    {{ record.updatedAt || "Update time unavailable" }}</small
                  ></span
                ><span class="badge">{{ label(record.status) }}</span>
              </button>
            } @empty {
              <div class="empty">No saved content yet.</div>
            }
          }
        </article>
        <article class="card">
          <h2>Generated preview</h2>
          <div class="preview">
            @if (loadingPreview()) {
              Loading generated content…
            } @else if (currentDraft()?.generatedContent; as content) {
              <pre>{{ content | json }}</pre>
            } @else {
              <p class="muted">
                Generate a version to preview server-persisted content.
              </p>
            }
          </div>
        </article>
      </section>
    </div>`,
})
export class WorkspacePage {
  private readonly workflows = inject(WorkflowService);
  private readonly jobs = inject(AiJobService);
  private readonly approvals = inject(ApprovalService);
  private readonly destroyRef = inject(DestroyRef);
  readonly kind = input.required<WorkflowKind>();
  form = new FormGroup<Record<string, FormControl<string>>>({});
  readonly records = signal<readonly WorkflowDraft[]>([]);
  readonly currentDraft = signal<WorkflowDraft | null>(null);
  readonly currentJob = signal<AsyncJob<ContentGenerationResult> | null>(null);
  readonly approval = signal<ReviewQueueItem | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly cancelling = signal(false);
  readonly submittingForReview = signal(false);
  readonly loadingPreview = signal(false);
  readonly workflowError = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly config = computed(() => CONFIG[this.kind()]);
  readonly statusLabel = computed(() =>
    this.label(this.currentDraft()?.status ?? "draft"),
  );
  readonly canSubmitForReview = computed(
    () =>
      this.currentDraft()?.status === "version_ready" &&
      !this.submittingForReview(),
  );

  constructor() {
    effect(() => {
      this.kind();
      this.rebuildForm();
      this.loadRecent();
    });
  }
  label(status: ContentWorkflowStatus): string {
    return STATUS_LABELS[status];
  }
  saveDraft(): void {
    this.persist().subscribe();
  }
  generate(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.generating()) return;
    this.generating.set(true);
    this.workflowError.set(null);
    this.persist()
      .pipe(
        switchMap((draft) =>
          this.workflows.generate(this.kind(), draft.id, draft.revision),
        ),
        switchMap((job) => {
          this.currentJob.set(job);
          return this.jobs.watch(job);
        }),
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (job) => {
          this.currentJob.set(job);
          if (job.status === "completed") this.loadGenerated(job.result);
          // Terminal content state is loaded from the backend. Operation failure
          // must not invent a persisted draft status in the browser.
          else if (job.status === "failed" || job.status === "cancelled")
            this.loadGenerated(job.result);
        },
        error: (error) => this.workflowError.set(message(error)),
      });
  }
  submitForReview(): void {
    const draft = this.currentDraft();
    if (!draft || !this.canSubmitForReview()) return;
    this.submittingForReview.set(true);
    this.workflowError.set(null);
    this.approvals
      .submitContent(this.kind(), draft.id)
      .pipe(
        finalize(() => this.submittingForReview.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (approval) => {
          this.approval.set(approval);
          this.loadGenerated();
          this.loadRecent();
        },
        error: (error) => this.workflowError.set(message(error)),
      });
  }
  cancelJob(): void {
    const job = this.currentJob();
    if (!job || this.cancelling()) return;
    this.cancelling.set(true);
    this.jobs
      .cancel(job.id)
      .pipe(
        finalize(() => this.cancelling.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (value) => this.currentJob.set({ ...value, result: undefined }),
        error: (error) => this.workflowError.set(message(error)),
      });
  }
  select(draft: WorkflowDraft): void {
    this.currentDraft.set(draft);
    this.form.patchValue(draft.brief ?? {});
    if (draft.generatedContent === undefined)
      this.loadGenerated({
        contentId: draft.id,
        versionId: draft.currentVersionId,
        revision: draft.revision,
      });
  }
  private persist() {
    this.form.markAllAsTouched();
    const existing = this.currentDraft();
    const request = existing
      ? this.workflows.saveDraft(
          this.kind(),
          existing.id,
          this.form.getRawValue(),
          existing.revision,
        )
      : this.workflows.createDraft(this.kind(), this.form.getRawValue());
    this.saving.set(true);
    this.workflowError.set(null);
    return request.pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
      switchMap((draft) => {
        this.currentDraft.set(draft);
        this.loadRecent();
        return [draft];
      }),
    );
  }
  loadRecent(): void {
    this.loading.set(true);
    this.recordsError.set(null);
    this.workflows
      .list(this.kind())
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => this.records.set(page.items),
        error: (error) => this.recordsError.set(message(error)),
      });
  }
  private loadGenerated(result?: ContentGenerationResult): void {
    const id = result?.contentId ?? this.currentDraft()?.id;
    if (!id) {
      this.workflowError.set("Generation completed without a content result.");
      return;
    }
    this.loadingPreview.set(true);
    this.workflows
      .get(this.kind(), id)
      .pipe(
        finalize(() => this.loadingPreview.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (draft) => {
          this.currentDraft.set(draft);
          this.loadRecent();
        },
        error: (error) => this.workflowError.set(message(error)),
      });
  }
  private rebuildForm(): void {
    this.currentDraft.set(null);
    this.currentJob.set(null);
    this.approval.set(null);
    this.workflowError.set(null);
    this.recordsError.set(null);
    const controls: Record<string, FormControl<string>> = {};
    for (const item of this.config().fields)
      controls[item.key] = new FormControl("", {
        nonNullable: true,
        validators: item.required ? [Validators.required] : [],
      });
    this.form = new FormGroup(controls);
  }
}
function field(
  key: string,
  label: string,
  type: WorkflowFieldConfig["type"] = "text",
  required = true,
): WorkflowFieldConfig {
  return { key, label, type, required };
}
function message(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 409)
      return "This content changed on the server. Reload it before saving again.";
    const body = error.error as { message?: string } | null;
    return body?.message ?? `The workflow request failed (${error.status}).`;
  }
  return "The workflow service is unavailable.";
}
