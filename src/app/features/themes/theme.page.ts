import { HttpErrorResponse } from "@angular/common/http";
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
import { debounceTime, finalize, forkJoin, of, switchMap } from "rxjs";
import { AiJobService } from "../../core/ai/ai-job.service";
import { DraftRepository } from "../../core/persistence/draft.repository";
import type { EntityId, IsoDateTime } from "../../models/domain.models";
import { PlatformStateService } from "../../services/platform-state.service";
import { ThemeApprovalPanelComponent } from "./theme-approval-panel.component";
import { ThemeBriefFormComponent } from "./theme-brief-form.component";
import { ThemeCommentsComponent } from "./theme-comments.component";
import type {
  ApiProblem,
  AudienceType,
  ThemeApproval,
  ThemeComment,
  ThemeDraftForm,
  ThemeJob,
  ThemeRecord,
  ThemeRefinementAction,
  ThemeSummary,
  ThemeTimelineEvent,
  ThemeTone,
  ThemeVersion,
} from "./theme.models";
import { THEME_MONTHS } from "./theme.models";
import { ThemePreviewComponent } from "./theme-preview.component";
import { ThemeService } from "./theme.service";
import { ThemeTimelineComponent } from "./theme-timeline.component";
import { ThemeVersionsComponent } from "./theme-versions.component";

const year = new Date().getFullYear();
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ThemeBriefFormComponent,
    ThemePreviewComponent,
    ThemeTimelineComponent,
    ThemeVersionsComponent,
    ThemeApprovalPanelComponent,
    ThemeCommentsComponent,
  ],
  styles: [
    `
      .hero,
      .actions,
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .actions {
        justify-content: flex-start;
        flex-wrap: wrap;
        margin: 1rem 0;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.2fr);
        gap: 1rem;
        align-items: start;
      }
      .rail {
        display: grid;
        gap: 1rem;
      }
      .recent-row {
        width: 100%;
        display: flex;
        justify-content: space-between;
        text-align: left;
        padding: 0.8rem;
        border: 0;
        border-bottom: 1px solid var(--line);
        background: transparent;
      }
      .recent-row:hover {
        background: #f8f6fc;
      }
      .skeleton {
        height: 4rem;
        background: linear-gradient(90deg, #eee, #fafafa, #eee);
        border-radius: 10px;
        margin: 0.5rem 0;
      }
      .progress {
        height: 8px;
        border-radius: 8px;
        background: #e9e4f6;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--violet);
        transition: width 0.3s;
      }
      .refine {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .error-panel {
        border-left: 4px solid var(--danger);
      }
      dialog {
        border: 0;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 20px 70px #19102f55;
        max-width: 440px;
      }
      dialog::backdrop {
        background: #170d3088;
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
      }
    `,
  ],
  template: `<header class="hero">
      <div>
        <p class="eyebrow">Theme generator</p>
        <h1>{{ currentTheme()?.title || "Theme generation workspace" }}</h1>
        <p class="muted">
          Create a scripture-centered monthly direction and govern every
          revision.
        </p>
      </div>
      <span class="badge">{{ statusLabel() }}</span>
    </header>
    <div class="actions">
      <button
        class="btn secondary"
        type="button"
        [disabled]="savingDraft() || approved()"
        (click)="saveDraft()"
      >
        {{ savingDraft() ? "Saving…" : "Save draft" }}</button
      ><button
        class="btn"
        type="button"
        [disabled]="generating() || approved()"
        (click)="generate()"
      >
        ✦ {{ generating() ? "Generating…" : "Generate theme" }}
      </button>
      @if (lastSavedAt()) {
        <small>Saved {{ lastSavedAt() }}</small>
      }
    </div>
    @if (saveError()) {
      <section class="card error-panel" role="alert">
        <b>Draft could not be saved.</b>
        <p>{{ saveError()?.message }}</p>
        @if (saveError()?.correlationId) {
          <small>Reference: {{ saveError()?.correlationId }}</small>
        }
      </section>
    }
    @if (job(); as j) {
      <section class="card" aria-live="polite">
        <div class="section-head">
          <div>
            <b>{{ jobLabel(j) }}</b>
            <p>{{ j.message || "Your theme is being prepared." }}</p>
          </div>
          <b>{{ j.progress }}%</b>
        </div>
        <div class="progress"><span [style.width.%]="j.progress"></span></div>
        @if (j.cancellationSupported) {
          <button class="btn secondary" type="button" (click)="confirmCancel()">
            Cancel generation
          </button>
        }
      </section>
    }
    @if (generationError()) {
      <section class="card error-panel">
        <b>Generation failed</b>
        <p>{{ generationError()?.message }}</p>
      </section>
    }
    <div class="workspace">
      <div class="rail">
        <app-theme-brief-form [form]="form" />
        <section class="card">
          <div class="section-head">
            <div>
              <p class="eyebrow">Recent themes</p>
              <h2>Continue your work</h2>
            </div>
            <button type="button" class="btn secondary" (click)="loadRecent()">
              Refresh
            </button>
          </div>
          @if (recentThemesLoading()) {
            @for (i of [1, 2, 3]; track i) {
              <div class="skeleton"></div>
            }
          } @else if (recentThemesError()) {
            <div class="error-panel" role="alert">
              <b>Unable to load recent themes.</b>
              <p>{{ recentThemesError()?.message }}</p>
              @if (recentThemesError()?.correlationId) {
                <small
                  >Reference: {{ recentThemesError()?.correlationId }}</small
                >
              }
              <br /><button
                class="btn secondary"
                type="button"
                (click)="loadRecent()"
              >
                Retry
              </button>
            </div>
          } @else {
            @for (theme of recentThemes(); track theme.id) {
              <button
                class="recent-row"
                type="button"
                (click)="selectTheme(theme)"
              >
                <span
                  ><b>{{ theme.title || "Untitled theme" }}</b
                  ><br /><small
                    >Revision {{ theme.revision }} ·
                    {{ theme.updatedAt }}</small
                  ></span
                ><span class="badge">{{ theme.status }}</span>
              </button>
            } @empty {
              <p class="muted">No persisted themes yet.</p>
            }
          }
        </section>
      </div>
      <div class="rail">
        <app-theme-preview
          [theme]="currentTheme()?.generatedContent || null"
          [loading]="previewLoading()"
          [error]="previewError()"
        />
        <section class="card">
          <p class="eyebrow">AI refinement</p>
          <h2>Shape this revision</h2>
          <div class="refine">
            @for (a of refinements; track a.action) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="!currentTheme() || generating() || approved()"
                (click)="refine(a.action)"
              >
                {{ a.label }}
              </button>
            }
          </div>
        </section>
        <app-theme-timeline
          [events]="timeline()"
          [loading]="timelineLoading()"
          [error]="timelineError()"
        /><app-theme-versions
          [versions]="versions()"
          [loading]="versionsLoading()"
          [error]="versionsError()"
        /><app-theme-approval-panel
          [approval]="approval()"
          [workflowStatus]="currentTheme()?.status || 'draft'"
          [error]="approvalError()"
          (submit)="submitReview()"
          (newRevision)="confirmRevision()"
        /><app-theme-comments
          [comments]="comments()"
          [error]="commentsError()"
          (add)="addComment($event)"
        />
      </div>
    </div>
    <dialog #confirmDialog>
      <h2>{{ dialogTitle() }}</h2>
      <p>{{ dialogMessage() }}</p>
      <div class="actions">
        <button class="btn" type="button" (click)="acceptDialog(confirmDialog)">
          Confirm</button
        ><button
          class="btn secondary"
          type="button"
          (click)="confirmDialog.close()"
        >
          Keep working
        </button>
      </div>
    </dialog>`,
})
export class ThemePage implements OnInit {
  private readonly themes = inject(ThemeService);
  private readonly jobs = inject(AiJobService);
  private readonly drafts = inject(DraftRepository);
  private readonly toast = inject(PlatformStateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = new FormGroup({
    month: new FormControl<number | null>(new Date().getMonth() + 1, [
      Validators.required,
      Validators.min(1),
      Validators.max(12),
    ]),
    year: new FormControl<number | null>(year, [Validators.required]),
    topic: new FormControl("", {
      nonNullable: true,
      validators: Validators.required,
    }),
    mainScripture: new FormControl("", {
      nonNullable: true,
      validators: Validators.required,
    }),
    supportingScriptures: new FormArray([
      new FormControl("", { nonNullable: true }),
    ]),
    spiritualEmphasis: new FormControl("", {
      nonNullable: true,
      validators: Validators.required,
    }),
    pastorNotes: new FormControl("", { nonNullable: true }),
    previousTheme: new FormControl("", { nonNullable: true }),
    upcomingEvents: new FormArray([new FormControl("", { nonNullable: true })]),
    tone: new FormControl<ThemeTone | null>("pastoral", Validators.required),
    intendedAudience: new FormControl<AudienceType[]>(["whole-church"], {
      nonNullable: true,
      validators: Validators.required,
    }),
  });
  readonly recentThemes = signal<ThemeSummary[]>([]);
  readonly recentThemesLoading = signal(false);
  readonly recentThemesError = signal<ApiProblem | null>(null);
  readonly currentTheme = signal<ThemeRecord | null>(null);
  readonly savingDraft = signal(false);
  readonly saveError = signal<ApiProblem | null>(null);
  readonly lastSavedAt = signal<string | null>(null);
  readonly generating = signal(false);
  readonly generationError = signal<ApiProblem | null>(null);
  readonly job = signal<ThemeJob | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<ApiProblem | null>(null);
  readonly timeline = signal<readonly ThemeTimelineEvent[]>([]);
  readonly timelineLoading = signal(false);
  readonly timelineError = signal<ApiProblem | null>(null);
  readonly versions = signal<readonly ThemeVersion[]>([]);
  readonly versionsLoading = signal(false);
  readonly versionsError = signal<ApiProblem | null>(null);
  readonly approval = signal<ThemeApproval | null>(null);
  readonly approvalError = signal<ApiProblem | null>(null);
  readonly comments = signal<readonly ThemeComment[]>([]);
  readonly commentsError = signal<ApiProblem | null>(null);
  readonly pageError = signal<ApiProblem | null>(null);
  readonly dialogTitle = signal("");
  readonly dialogMessage = signal("");
  private dialogAction: (() => void) | null = null;
  readonly approved = computed(
    () =>
      this.currentTheme()?.status === "approved" ||
      this.approval()?.status === "approved",
  );
  readonly statusLabel = computed(
    () =>
      (
        ({
          draft: "Draft",
          generating: "Generating",
          version_ready: "Version ready",
          pending_approval: "Awaiting Approval",
          in_review: "In Review",
          changes_requested: "Changes Requested",
          approved: "Approved",
          rejected: "Rejected",
          failed: "Failed",
          cancelled: "Cancelled",
        }) as Record<string, string>
      )[this.currentTheme()?.status || "draft"] || this.currentTheme()?.status,
  );
  readonly refinements = [
    { label: "Make more prophetic", action: "more_prophetic" },
    { label: "Make more pastoral", action: "more_pastoral" },
    { label: "Simplify", action: "simplify" },
    { label: "Add scriptures", action: "add_scriptures" },
    { label: "Shorten", action: "shorten" },
    { label: "Expand", action: "expand" },
    { label: "Create alternatives", action: "create_alternatives" },
  ] as const;
  ngOnInit() {
    this.loadRecent();
    this.restoreRecovery();
    this.form.valueChanges
      .pipe(debounceTime(800), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.saveRecovery());
  }
  loadRecent() {
    this.recentThemesLoading.set(true);
    this.recentThemesError.set(null);
    this.themes
      .list()
      .pipe(
        finalize(() => this.recentThemesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => this.recentThemes.set([...p.items]),
        error: (e) => this.recentThemesError.set(problem(e)),
      });
  }
  selectTheme(summary: ThemeSummary) {
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.themes
      .get(summary.id)
      .pipe(
        finalize(() => this.previewLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (t) => {
          this.currentTheme.set(t);
          this.patch(t.brief);
          this.loadPanels(t.id);
        },
        error: (e) => this.previewError.set(problem(e)),
      });
  }
  saveDraft() {
    this.persist().subscribe({
      next: () =>
        this.toast.notify({
          tone: "success",
          title: "Draft saved",
          message: "Your theme brief is safely persisted.",
        }),
      error: (e) => this.saveError.set(problem(e)),
    });
  }
  private persist() {
    this.form.markAllAsTouched();
    if (this.form.invalid)
      return of(null).pipe(
        switchMap(() => {
          throw new Error("Complete required theme fields.");
        }),
      );
    this.savingDraft.set(true);
    this.saveError.set(null);
    const old = this.currentTheme(),
      brief = this.value();
    const request = old
      ? this.themes.save(old.id, brief, old.revision)
      : this.themes.create(brief);
    return request.pipe(
      finalize(() => this.savingDraft.set(false)),
      takeUntilDestroyed(this.destroyRef),
      switchMap((t) => {
        this.currentTheme.set(t);
        this.lastSavedAt.set(new Date().toLocaleTimeString());
        this.drafts.remove(this.recoveryKey(old?.id));
        this.loadRecent();
        return of(t);
      }),
    );
  }
  generate() {
    if (this.generating() || this.approved()) return;
    this.generationError.set(null);
    this.persist()
      .pipe(
        switchMap((t) => this.themes.generate(t.id, t.revision)),
        switchMap((j) => {
          this.job.set(j);
          this.generating.set(true);
          this.toast.notify({
            tone: "info",
            title: "Generation started",
            message: "AI generation is now running.",
          });
          return this.jobs.watch(j);
        }),
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (j) => {
          this.job.set(j as ThemeJob);
          if (j.status === "completed") {
            this.toast.notify({
              tone: "success",
              title: "Theme generated",
              message: "The new version is ready.",
            });
            this.reload();
          } else if (j.status === "failed" || j.status === "cancelled")
            this.reload();
        },
        error: (e) => this.generationError.set(problem(e)),
      });
  }
  refine(action: ThemeRefinementAction) {
    const t = this.currentTheme();
    if (!t) return;
    this.generating.set(true);
    this.themes
      .refine(t.id, { action, expectedRevision: t.revision })
      .pipe(
        switchMap((j) => this.jobs.watch(j)),
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (j) => {
          this.job.set(j as ThemeJob);
          if (j.status === "completed") {
            this.toast.notify({
              tone: "success",
              title: "Refinement completed",
              message: "A new theme version was created.",
            });
            this.reload();
          }
        },
        error: (e) => this.generationError.set(problem(e)),
      });
  }
  confirmCancel() {
    this.openDialog(
      "Cancel generation?",
      "The server will stop this generation job.",
      () => {
        const j = this.job();
        if (j)
          this.jobs.cancel(j.id).subscribe({
            next: () => {
              this.toast.notify({
                tone: "info",
                title: "Generation cancelled",
                message: "The theme was reloaded.",
              });
              this.reload();
            },
            error: (e) => this.generationError.set(problem(e)),
          });
      },
    );
  }
  confirmRevision() {
    this.openDialog(
      "Create a new revision?",
      "The approved revision stays protected. A new editable revision will be created.",
      () => {
        const t = this.currentTheme();
        if (t)
          this.themes.createRevision(t.id).subscribe({
            next: (n) => {
              this.currentTheme.set(n);
              this.patch(n.brief);
              this.loadPanels(n.id);
              this.toast.notify({
                tone: "success",
                title: "Revision created",
                message: "The approved version remains unchanged.",
              });
            },
            error: (e) => this.approvalError.set(problem(e)),
          });
      },
    );
  }
  openDialog(title: string, msg: string, action: () => void) {
    this.dialogTitle.set(title);
    this.dialogMessage.set(msg);
    this.dialogAction = action;
    (document.querySelector("dialog") as HTMLDialogElement)?.showModal();
  }
  acceptDialog(d: HTMLDialogElement) {
    d.close();
    this.dialogAction?.();
    this.dialogAction = null;
  }
  submitReview() {
    const t = this.currentTheme();
    if (!t) return;
    this.themes.submitReview(t.id).subscribe({
      next: (n) => {
        this.currentTheme.set(n);
        this.loadPanels(n.id);
        this.toast.notify({
          tone: "success",
          title: "Submitted for review",
          message: "This version is awaiting approval.",
        });
      },
      error: (e) => this.approvalError.set(problem(e)),
    });
  }
  addComment(body: string) {
    const t = this.currentTheme();
    if (!t) return;
    this.themes
      .addComment(t.id, body)
      .subscribe({
        next: (c) => this.comments.update((x) => [...x, c]),
        error: (e) => this.commentsError.set(problem(e)),
      });
  }
  private reload() {
    const t = this.currentTheme();
    if (t) this.selectTheme(t);
  }
  private loadPanels(id: EntityId) {
    this.timelineLoading.set(true);
    this.versionsLoading.set(true);
    this.timelineError.set(null);
    this.versionsError.set(null);
    forkJoin({
      timeline: this.themes.timeline(id),
      versions: this.themes.versions(id),
      approval: this.themes.approval(id),
      comments: this.themes.comments(id),
    })
      .pipe(
        finalize(() => {
          this.timelineLoading.set(false);
          this.versionsLoading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => {
          this.timeline.set(r.timeline);
          this.versions.set(r.versions);
          this.approval.set(r.approval);
          this.comments.set(r.comments);
        },
        error: (e) => {
          const p = problem(e);
          this.timelineError.set(p);
          this.versionsError.set(p);
          this.approvalError.set(p);
          this.commentsError.set(p);
        },
      });
  }
  private value(): ThemeDraftForm {
    return {
      month: this.form.controls.month.value,
      year: this.form.controls.year.value,
      topic: this.form.controls.topic.value,
      mainScripture: this.form.controls.mainScripture.value,
      supportingScriptures: this.form.controls.supportingScriptures
        .getRawValue()
        .filter(Boolean),
      spiritualEmphasis: this.form.controls.spiritualEmphasis.value,
      pastorNotes: this.form.controls.pastorNotes.value,
      previousTheme: this.form.controls.previousTheme.value,
      upcomingEvents: this.form.controls.upcomingEvents
        .getRawValue()
        .filter(Boolean),
      tone: this.form.controls.tone.value,
      intendedAudience: this.form.controls.intendedAudience.value,
    };
  }
  private patch(b: ThemeDraftForm) {
    this.form.controls.supportingScriptures.clear();
    for (const x of b.supportingScriptures.length
      ? b.supportingScriptures
      : [""])
      this.form.controls.supportingScriptures.push(
        new FormControl(x, { nonNullable: true }),
      );
    this.form.controls.upcomingEvents.clear();
    for (const x of b.upcomingEvents.length ? b.upcomingEvents : [""])
      this.form.controls.upcomingEvents.push(
        new FormControl(x, { nonNullable: true }),
      );
    this.form.patchValue(b, { emitEvent: false });
    this.form.markAsPristine();
  }
  private recoveryKey(id?: EntityId) {
    return `themes:${id || "new"}`;
  }
  private async saveRecovery() {
    if (!this.form.dirty) return;
    const t = this.currentTheme();
    await this.drafts.save({
      key: this.recoveryKey(t?.id),
      organizationId: "local" as EntityId,
      feature: "themes",
      entityId: t?.id,
      payload: this.value(),
      localRevision: (t?.revision || 0) + 1,
      serverRevision: t?.revision,
      updatedAt: new Date().toISOString() as IsoDateTime,
      syncState: "local",
    });
  }
  private async restoreRecovery() {
    const d = await this.drafts.read<ThemeDraftForm>(this.recoveryKey());
    if (d) {
      this.patch(d.payload);
      this.form.markAsDirty();
      this.toast.notify({
        tone: "warning",
        title: "Unsaved draft recovered",
        message: "Review and save the recovered theme brief.",
      });
    }
  }
  jobLabel(j: ThemeJob) {
    if (j.status === "queued") return "Queued";
    if (j.status === "completed") return "Complete";
    if (j.progress >= 90) return "Finalizing";
    return "Generating";
  }
}
function problem(e: unknown): ApiProblem {
  if (e instanceof HttpErrorResponse) {
    const b = e.error as { message?: string; correlationId?: string } | null;
    return {
      message: b?.message || `Theme request failed (${e.status}).`,
      correlationId:
        b?.correlationId || e.headers?.get("X-Correlation-ID") || undefined,
      status: e.status,
    };
  }
  return {
    message:
      e instanceof Error ? e.message : "The theme service is unavailable.",
  };
}
