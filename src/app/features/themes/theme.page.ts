import { HttpErrorResponse } from "@angular/common/http";
import { JsonPipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { finalize, switchMap } from "rxjs";
import { AiJobService } from "../../core/ai/ai-job.service";
import type { AsyncJob } from "../../models/domain.models";
import { ApprovalService } from "../reviews/approval.service";
import type {
  ContentGenerationResult,
  ContentWorkflowStatus,
  WorkflowDraft,
} from "../workspace/workflow.service";
import { WorkflowService } from "../workspace/workflow.service";
import {
  THEME_MONTHS,
  type GeneratedTheme,
  type ThemeAudience,
  type ThemeTone,
} from "./theme.models";

const currentYear = new Date().getFullYear();
const STATUS: Readonly<Record<ContentWorkflowStatus, string>> = {
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
      .hero,
      .toolbar,
      .section-head,
      .history-row,
      .chip-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .toolbar,
      .chip-row {
        flex-wrap: wrap;
      }
      .workspace {
        grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.25fr);
        align-items: start;
      }
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .span-2 {
        grid-column: 1/-1;
      }
      .compact {
        grid-template-columns: 1.4fr 0.8fr auto;
        align-items: end;
      }
      .check-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 0.55rem;
      }
      .check {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.55rem 0.7rem;
        border: 1px solid var(--line);
        border-radius: 999px;
        font-size: 0.82rem;
      }
      .check input {
        width: auto;
      }
      .preview {
        background: linear-gradient(145deg, #2c1d55, #5b3eb3);
        color: white;
        border-radius: 16px;
        padding: clamp(1.4rem, 4vw, 2.5rem);
        min-height: 330px;
      }
      .preview h2,
      .preview h3 {
        color: white;
      }
      .preview .muted {
        color: #ddd5f4;
      }
      .preview-section {
        border-top: 1px solid #ffffff2b;
        padding-top: 1rem;
        margin-top: 1rem;
      }
      .history-row {
        width: 100%;
        text-align: left;
        padding: 0.8rem 0;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: none;
      }
      .error-panel {
        border-left: 4px solid var(--danger);
      }
      .skeleton {
        height: 4rem;
        border-radius: 10px;
        background: linear-gradient(90deg, #eee, #f7f7f7, #eee);
        background-size: 200%;
        animation: pulse 1.2s infinite;
      }
      @keyframes pulse {
        to {
          background-position: -200% 0;
        }
      }
      .progress {
        height: 7px;
        background: #e9e4f6;
        border-radius: 9px;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--violet);
      }
      @media (max-width: 950px) {
        .workspace {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 600px) {
        .hero {
          align-items: flex-start;
          flex-direction: column;
        }
        .form-grid,
        .compact {
          grid-template-columns: 1fr;
        }
        .span-2 {
          grid-column: auto;
        }
      }
    `,
  ],
  template: ` <header class="hero">
      <div>
        <p class="eyebrow">Theme generator</p>
        <h1>Theme generation workspace</h1>
        <p class="muted">
          Shape a scripture-centered monthly direction, refine it with AI, and
          govern every approved version.
        </p>
      </div>
      <span class="badge" [class.warning]="status() === 'pending_approval'">{{
        statusLabel()
      }}</span>
    </header>
    <div class="toolbar" aria-label="Theme actions">
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
        {{
          generating()
            ? "Generating…"
            : currentDraft()
              ? "✦ Regenerate theme"
              : "✦ Generate theme"
        }}
      </button>
      @if (canSubmit()) {
        <button
          class="btn"
          type="button"
          [disabled]="submitting()"
          (click)="submitForReview()"
        >
          {{ submitting() ? "Submitting…" : "Submit for review" }}
        </button>
      }
      @if (status() === "approved") {
        <button class="btn secondary" type="button" (click)="startRevision()">
          Create new revision
        </button>
      }
    </div>
    @if (job(); as activeJob) {
      <section class="card" aria-live="polite">
        <b>Generation {{ activeJob.status }} · {{ activeJob.progress }}%</b>
        <div class="progress">
          <span [style.width.%]="activeJob.progress"></span>
        </div>
      </section>
    }
    @if (workflowError()) {
      <section class="card error-panel" role="alert">
        <b>Unable to complete that theme action</b>
        <p>{{ workflowError() }}</p>
      </section>
    }
    <div class="grid workspace">
      <form class="card form-grid" [formGroup]="form" aria-label="Theme brief">
        <div class="span-2">
          <p class="eyebrow">Theme brief</p>
          <h2>Pastoral direction</h2>
        </div>
        <div class="field">
          <label for="month">Month</label
          ><select id="month" formControlName="month">
            @for (month of months; track month; let index = $index) {
              <option [ngValue]="index + 1">{{ month }}</option>
            }
          </select>
        </div>
        <div class="field">
          <label for="year">Year</label
          ><input
            id="year"
            type="number"
            inputmode="numeric"
            [min]="currentYear - 1"
            [max]="currentYear + 10"
            formControlName="year"
          />
        </div>
        <div class="field span-2">
          <label for="topic">Topic</label
          ><input
            id="topic"
            formControlName="topic"
            placeholder="e.g. Walking in divine wisdom"
          />
        </div>
        <div class="field span-2">
          <label for="mainScripture">Main scripture</label
          ><input
            id="mainScripture"
            formControlName="mainScripture"
            placeholder="Book chapter:verse"
          />
        </div>
        <fieldset class="field span-2" formArrayName="supportingScriptures">
          <legend>Supporting scriptures</legend>
          @for (control of supportingScriptures.controls; track $index) {
            <div class="form-grid compact">
              <label class="sr-only" [for]="'scripture-' + $index"
                >Supporting scripture {{ $index + 1 }}</label
              ><input
                [id]="'scripture-' + $index"
                [formControlName]="$index"
                placeholder="Book chapter:verse"
              /><button
                class="btn secondary"
                type="button"
                [disabled]="supportingScriptures.length === 1"
                (click)="removeScripture($index)"
                [attr.aria-label]="
                  'Remove supporting scripture ' + ($index + 1)
                "
              >
                Remove
              </button>
            </div>
          }
          <button class="btn secondary" type="button" (click)="addScripture()">
            + Add scripture
          </button>
        </fieldset>
        <div class="field span-2">
          <label for="emphasis">Spiritual emphasis</label
          ><textarea
            id="emphasis"
            rows="4"
            formControlName="spiritualEmphasis"
            placeholder="Describe the spiritual outcome and doctrinal emphasis"
          ></textarea>
        </div>
        <div class="field span-2">
          <label for="notes">Pastor notes</label
          ><textarea
            id="notes"
            rows="5"
            formControlName="pastorNotes"
            placeholder="Add pastoral context, phrases, or boundaries"
          ></textarea>
        </div>
        <div class="field">
          <label for="previous">Previous theme</label
          ><input id="previous" formControlName="previousTheme" />
        </div>
        <div class="field">
          <label for="events">Upcoming events</label
          ><input
            id="events"
            formControlName="upcomingEvents"
            placeholder="Comma-separated events"
          />
        </div>
        <div class="field">
          <label for="tone">Tone</label
          ><select id="tone" formControlName="tone">
            <option value="pastoral">Pastoral</option>
            <option value="prophetic">Prophetic</option>
            <option value="teaching">Teaching</option>
            <option value="evangelistic">Evangelistic</option>
          </select>
        </div>
        <fieldset class="field">
          <legend>Intended audience</legend>
          <div class="check-grid">
            @for (audience of audiences; track audience.value) {
              <label class="check"
                ><input
                  type="checkbox"
                  [checked]="hasAudience(audience.value)"
                  (change)="toggleAudience(audience.value, $event)"
                />{{ audience.label }}</label
              >
            }
          </div>
        </fieldset>
        @if (form.invalid && form.touched) {
          <p class="error span-2" role="alert">
            Complete the month, year, topic, main scripture, emphasis, tone, and
            audience.
          </p>
        }
      </form>
      <section class="grid">
        <article class="card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Generated theme</p>
              <h2>Ministry preview</h2>
            </div>
            @if (currentDraft()) {
              <small>Revision {{ currentDraft()?.revision }}</small>
            }
          </div>
          @if (loadingPreview()) {
            <div class="skeleton" aria-label="Loading generated theme"></div>
          } @else if (generated(); as theme) {
            <div class="preview">
              <p class="eyebrow">
                {{ monthLabel() }} {{ form.controls.year.value }}
              </p>
              <h2>
                {{
                  theme.themeTitle ||
                    theme.title ||
                    currentDraft()?.title ||
                    "Monthly theme"
                }}
              </h2>
              @if (theme.subtitle) {
                <h3>{{ theme.subtitle }}</h3>
              }
              @if (theme.scriptures?.length) {
                <p><b>Scriptures</b> · {{ theme.scriptures?.join(" · ") }}</p>
              }
              @if (theme.explanation) {
                <p>{{ theme.explanation }}</p>
              }
              @if (theme.pastoralIntroduction) {
                <section class="preview-section">
                  <h3>Pastoral introduction</h3>
                  <p>{{ theme.pastoralIntroduction }}</p>
                </section>
              }
              @if (theme.objectives?.length) {
                <section class="preview-section">
                  <h3>Objectives</h3>
                  <ul>
                    @for (item of theme.objectives; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </section>
              }
              @if (theme.weeklyTeachingDirection?.length) {
                <section class="preview-section">
                  <h3>Weekly teaching direction</h3>
                  <ol>
                    @for (item of theme.weeklyTeachingDirection; track item) {
                      <li>{{ item }}</li>
                    }
                  </ol>
                </section>
              }
              @if (theme.monthlyConfession) {
                <section class="preview-section">
                  <h3>Monthly confession</h3>
                  <p>{{ theme.monthlyConfession }}</p>
                </section>
              }
              @if (theme.propheticDeclaration) {
                <section class="preview-section">
                  <h3>Prophetic declaration</h3>
                  <p>{{ theme.propheticDeclaration }}</p>
                </section>
              }
              @if (theme.flyerHeadline) {
                <section class="preview-section">
                  <h3>Flyer headline</h3>
                  <p>{{ theme.flyerHeadline }}</p>
                </section>
              }
              @if (theme.designConcept) {
                <section class="preview-section">
                  <h3>Design concept</h3>
                  <p>{{ theme.designConcept }}</p>
                </section>
              }
              @if (theme.hashtags?.length) {
                <p>{{ theme.hashtags?.join(" ") }}</p>
              }
            </div>
          } @else if (rawGenerated()) {
            <details>
              <summary>Generated content</summary>
              <pre>{{ rawGenerated() | json }}</pre>
            </details>
          } @else {
            <div class="empty">
              <b>No generated theme yet.</b>
              <p>Complete the brief and generate your first monthly theme.</p>
            </div>
          }
        </article>
        <article class="card">
          <div class="section-head">
            <div>
              <p class="eyebrow">AI refinement</p>
              <h2>Refine this version</h2>
            </div>
          </div>
          <div class="chip-row">
            @for (action of refinementActions; track action) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="!currentDraft() || generating()"
                (click)="refine(action)"
              >
                {{ action }}
              </button>
            }
          </div>
        </article>
        <article class="card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Version history</p>
              <h2>Recent themes</h2>
            </div>
            <button class="btn secondary" type="button" (click)="loadRecent()">
              Refresh
            </button>
          </div>
          @if (loadingRecent()) {
            @for (item of [1, 2]; track item) {
              <div class="skeleton"></div>
            }
          } @else if (recordsError()) {
            <div class="error-panel" role="alert">
              <b>Unable to load themes</b>
              <p>{{ recordsError() }}</p>
              <button
                type="button"
                class="btn secondary"
                (click)="loadRecent()"
              >
                Retry
              </button>
            </div>
          } @else {
            @for (record of records(); track record.id) {
              <button
                class="history-row"
                type="button"
                (click)="select(record)"
              >
                <span
                  ><b>{{ record.title || "Untitled theme" }}</b
                  ><br /><small
                    >Revision {{ record.revision }} ·
                    {{ record.updatedAt || "Date unavailable" }}</small
                  ></span
                ><span class="badge">{{ label(record.status) }}</span>
              </button>
            } @empty {
              <div class="empty">
                No themes yet.<br />Create your first monthly theme.
              </div>
            }
          }
        </article>
        <article class="card">
          <p class="eyebrow">Approval status</p>
          <h2>{{ statusLabel() }}</h2>
          <p class="muted">
            Comments and reviewer activity remain attached to the submitted
            version. Open Review & Approval for the full audit history.
          </p>
        </article>
      </section>
    </div>`,
})
export class ThemePage implements OnInit {
  private readonly workflows = inject(WorkflowService);
  private readonly jobs = inject(AiJobService);
  private readonly approvals = inject(ApprovalService);
  private readonly destroyRef = inject(DestroyRef);
  readonly months = THEME_MONTHS;
  readonly currentYear = currentYear;
  readonly audiences: readonly { value: ThemeAudience; label: string }[] = [
    { value: "whole-church", label: "Whole church" },
    { value: "adults", label: "Adults" },
    { value: "youth", label: "Youth" },
    { value: "families", label: "Families" },
    { value: "leaders", label: "Leaders" },
  ];
  readonly refinementActions = [
    "More prophetic",
    "More pastoral",
    "Simplify",
    "Add scriptures",
    "Shorten",
    "Expand",
  ] as const;
  readonly form = new FormGroup({
    month: new FormControl(new Date().getMonth() + 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(12)],
    }),
    year: new FormControl(currentYear, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(currentYear - 1)],
    }),
    topic: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    mainScripture: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    supportingScriptures: new FormArray([
      new FormControl("", { nonNullable: true }),
    ]),
    spiritualEmphasis: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pastorNotes: new FormControl("", { nonNullable: true }),
    previousTheme: new FormControl("", { nonNullable: true }),
    upcomingEvents: new FormControl("", { nonNullable: true }),
    tone: new FormControl<ThemeTone>("pastoral", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    intendedAudience: new FormControl<ThemeAudience[]>(["whole-church"], {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly records = signal<readonly WorkflowDraft[]>([]);
  readonly currentDraft = signal<WorkflowDraft | null>(null);
  readonly job = signal<AsyncJob<ContentGenerationResult> | null>(null);
  readonly loadingRecent = signal(false);
  readonly loadingPreview = signal(false);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly submitting = signal(false);
  readonly workflowError = signal<string | null>(null);
  readonly recordsError = signal<string | null>(null);
  readonly status = computed(() => this.currentDraft()?.status ?? "draft");
  readonly statusLabel = computed(() => this.label(this.status()));
  readonly canSubmit = computed(
    () => this.status() === "version_ready" && !this.submitting(),
  );
  readonly rawGenerated = computed(() => this.currentDraft()?.generatedContent);
  readonly generated = computed(() => asGeneratedTheme(this.rawGenerated()));
  readonly monthLabel = computed(
    () => this.months[this.form.controls.month.value - 1] ?? "",
  );
  get supportingScriptures() {
    return this.form.controls.supportingScriptures;
  }
  ngOnInit() {
    this.loadRecent();
  }
  label(status: ContentWorkflowStatus) {
    return STATUS[status];
  }
  addScripture() {
    this.supportingScriptures.push(new FormControl("", { nonNullable: true }));
  }
  removeScripture(index: number) {
    if (this.supportingScriptures.length > 1)
      this.supportingScriptures.removeAt(index);
  }
  hasAudience(value: ThemeAudience) {
    return this.form.controls.intendedAudience.value.includes(value);
  }
  toggleAudience(value: ThemeAudience, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const values = this.form.controls.intendedAudience.value;
    this.form.controls.intendedAudience.setValue(
      checked ? [...values, value] : values.filter((item) => item !== value),
    );
    this.form.controls.intendedAudience.markAsDirty();
  }
  saveDraft() {
    this.persist().subscribe();
  }
  generate() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.generating()) return;
    this.generating.set(true);
    this.workflowError.set(null);
    this.persist()
      .pipe(
        switchMap((d) => this.workflows.generate("themes", d.id, d.revision)),
        switchMap((job) => {
          this.job.set(job);
          return this.jobs.watch(job);
        }),
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (job) => {
          this.job.set(job);
          if (["completed", "failed", "cancelled"].includes(job.status))
            this.loadGenerated(job.result);
        },
        error: (e) => this.workflowError.set(message(e)),
      });
  }
  submitForReview() {
    const draft = this.currentDraft();
    if (!draft || !this.canSubmit()) return;
    this.submitting.set(true);
    this.approvals
      .submitContent("themes", draft.id)
      .pipe(
        finalize(() => this.submitting.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.loadGenerated();
          this.loadRecent();
        },
        error: (e) => this.workflowError.set(message(e)),
      });
  }
  refine(action: string) {
    this.form.controls.pastorNotes.setValue(
      [this.form.controls.pastorNotes.value, `AI refinement: ${action}`]
        .filter(Boolean)
        .join("\n"),
    );
    this.generate();
  }
  startRevision() {
    this.currentDraft.set(null);
    this.job.set(null);
    this.form.markAsDirty();
  }
  select(draft: WorkflowDraft) {
    this.currentDraft.set(draft);
    this.patchBrief(draft.brief);
    if (draft.generatedContent === undefined)
      this.loadGenerated({
        contentId: draft.id,
        versionId: draft.currentVersionId,
        revision: draft.revision,
      });
  }
  loadRecent() {
    this.loadingRecent.set(true);
    this.recordsError.set(null);
    this.workflows
      .list("themes")
      .pipe(
        finalize(() => this.loadingRecent.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => this.records.set(p.items),
        error: (e) => this.recordsError.set(message(e)),
      });
  }
  private persist() {
    this.form.markAllAsTouched();
    const existing = this.currentDraft();
    const brief = serialize(this.form.getRawValue());
    const request = existing
      ? this.workflows.saveDraft(
          "themes",
          existing.id,
          brief,
          existing.revision,
        )
      : this.workflows.createDraft("themes", brief);
    this.saving.set(true);
    this.workflowError.set(null);
    return request.pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
      switchMap((d) => {
        this.currentDraft.set(d);
        this.loadRecent();
        return [d];
      }),
    );
  }
  private loadGenerated(result?: ContentGenerationResult) {
    const id = result?.contentId ?? this.currentDraft()?.id;
    if (!id) {
      this.workflowError.set("Generation completed without a content result.");
      return;
    }
    this.loadingPreview.set(true);
    this.workflows
      .get("themes", id)
      .pipe(
        finalize(() => this.loadingPreview.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (d) => {
          this.currentDraft.set(d);
          this.loadRecent();
        },
        error: (e) => this.workflowError.set(message(e)),
      });
  }
  private patchBrief(brief: Readonly<Record<string, string>> | undefined) {
    if (!brief) return;
    const scriptures = parseList(brief["supportingScriptures"]);
    this.supportingScriptures.clear();
    for (const scripture of scriptures.length ? scriptures : [""])
      this.supportingScriptures.push(
        new FormControl(scripture, { nonNullable: true }),
      );
    this.form.patchValue({
      month: Number(brief["month"] ?? new Date().getMonth() + 1),
      year: Number(brief["year"] ?? currentYear),
      topic: brief["topic"] ?? "",
      mainScripture: brief["mainScripture"] ?? "",
      spiritualEmphasis: brief["spiritualEmphasis"] ?? "",
      pastorNotes: brief["pastorNotes"] ?? "",
      previousTheme: brief["previousTheme"] ?? "",
      upcomingEvents: parseList(brief["upcomingEvents"]).join(", "),
      tone: (brief["tone"] as ThemeTone) || "pastoral",
      intendedAudience: parseList(brief["intendedAudience"]) as ThemeAudience[],
    });
  }
}
function serialize(value: {
  month: number;
  year: number;
  topic: string;
  mainScripture: string;
  supportingScriptures: string[];
  spiritualEmphasis: string;
  pastorNotes: string;
  previousTheme: string;
  upcomingEvents: string;
  tone: ThemeTone;
  intendedAudience: ThemeAudience[];
}): Readonly<Record<string, string>> {
  return {
    month: String(value.month),
    year: String(value.year),
    monthAndYear: `${value.year}-${String(value.month).padStart(2, "0")}`,
    topic: value.topic,
    mainScripture: value.mainScripture,
    supportingScriptures: JSON.stringify(
      value.supportingScriptures.filter(Boolean),
    ),
    spiritualEmphasis: value.spiritualEmphasis,
    pastorNotes: value.pastorNotes,
    previousTheme: value.previousTheme,
    upcomingEvents: JSON.stringify(parseList(value.upcomingEvents)),
    tone: value.tone,
    intendedAudience: JSON.stringify(value.intendedAudience),
  };
}
function parseList(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed))
      return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    /* Legacy comma-separated drafts remain readable. */
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
function asGeneratedTheme(value: unknown): GeneratedTheme | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as GeneratedTheme)
    : null;
}
function message(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const body = error.error as {
      message?: string;
      correlationId?: string;
    } | null;
    const reference = body?.correlationId
      ? ` Reference: ${body.correlationId}.`
      : "";
    return (
      (body?.message ?? `The theme service request failed (${error.status}).`) +
      reference
    );
  }
  return "The theme service is unavailable.";
}
