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
import { ActivatedRoute, Router } from "@angular/router";
import {
  catchError,
  finalize,
  forkJoin,
  of,
  switchMap,
  type Observable,
} from "rxjs";
import { AiJobService } from "../../core/ai/ai-job.service";
import type { EntityId } from "../../models/domain.models";
import { PrayerApprovalPanelComponent } from "./prayer-approval-panel.component";
import { PrayerBriefFormComponent } from "./prayer-brief-form.component";
import type {
  PrayerApproval,
  PrayerDraftForm,
  PrayerJob,
  PrayerPoint,
  PrayerRecord,
  PrayerStatus,
  PrayerSummary,
  PrayerTimelineEvent,
  PrayerVersion,
  ScriptureReference,
} from "./prayer.models";
import { prayerTitle } from "./prayer.models";
import { PrayerPreviewComponent } from "./prayer-preview.component";
import { PrayerRecentWorkComponent } from "./prayer-recent-work.component";
import { PrayerService } from "./prayer.service";
import { PrayerTimelineComponent } from "./prayer-timeline.component";
import { PrayerVersionHistoryComponent } from "./prayer-version-history.component";

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PrayerBriefFormComponent,
    PrayerRecentWorkComponent,
    PrayerPreviewComponent,
    PrayerTimelineComponent,
    PrayerVersionHistoryComponent,
    PrayerApprovalPanelComponent,
  ],
  styles: [
    `
      .hero,
      .title-row,
      .actions,
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .hero {
        margin-bottom: 1.2rem;
      }
      .hero h1 {
        margin: 0.15rem 0;
      }
      .title-row {
        justify-content: flex-start;
      }
      .actions {
        flex-wrap: wrap;
      }
      .workspace {
        display: grid;
        grid-template-columns: minmax(330px, 420px) minmax(0, 1fr);
        gap: 1.2rem;
        align-items: start;
      }
      .left,
      .right,
      .lower {
        display: grid;
        gap: 1.2rem;
      }
      .lower {
        grid-template-columns: 1fr 1fr;
      }
      .progress-card {
        margin-bottom: 1rem;
      }
      .progress {
        height: 8px;
        background: #e9e4f6;
        border-radius: 10px;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--violet);
        transition: width 0.3s;
      }
      .notice {
        border-left: 4px solid var(--green);
        margin-bottom: 1rem;
      }
      .error {
        border-left-color: var(--danger);
        color: var(--danger);
      }
      @media (max-width: 960px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        .left {
          display: contents;
        }
        .right {
          display: contents;
        }
        app-prayer-brief-form {
          order: 1;
        }
        app-prayer-recent-work {
          order: 2;
        }
        app-prayer-preview {
          order: 3;
        }
        .lower {
          order: 4;
        }
        app-prayer-approval-panel {
          order: 5;
        }
      }
      @media (max-width: 620px) {
        .hero {
          align-items: flex-start;
          flex-direction: column;
        }
        .lower {
          grid-template-columns: 1fr;
        }
        .actions {
          width: 100%;
        }
        .actions .btn {
          flex: 1;
        }
      }
    `,
  ],
  template: `<header class="hero">
      <div>
        <p class="eyebrow">Content workflow</p>
        <div class="title-row">
          <h1>Prayer collection builder</h1>
          <span class="badge">{{ statusLabel() }}</span>
        </div>
        <p class="muted">
          Create scripture-grounded prayer collections and submit a generated
          version for review.
        </p>
      </div>
      <div class="actions">
        <button
          class="btn secondary"
          type="button"
          [disabled]="busy() || approved()"
          (click)="saveDraft()"
        >
          {{ saving() ? "Saving…" : "Save draft" }}</button
        ><button
          class="btn"
          type="button"
          [disabled]="busy() || approved()"
          (click)="generate()"
        >
          ✦
          {{
            generating()
              ? "Generating…"
              : record()?.points?.length
                ? "Regenerate"
                : "Generate prayer points"
          }}
        </button>
      </div>
    </header>
    @if (message()) {
      <section
        class="card notice"
        [class.error]="isError()"
        [attr.role]="isError() ? 'alert' : 'status'"
      >
        {{ message() }}
      </section>
    }
    @if (conflict()) {
      <section class="card notice error" role="alert">
        <b>This prayer collection changed since you loaded it.</b>
        <p>
          Reload the latest version, or review and manually reapply your unsaved
          edits.
        </p>
        <div class="actions">
          <button
            class="btn secondary"
            type="button"
            (click)="reloadConflict()"
          >
            Reload latest
          </button>
          <button class="btn" type="button" (click)="reviewConflict()">
            Review changes
          </button>
        </div>
      </section>
    }
    @if (job(); as currentJob) {
      <section class="card progress-card" aria-live="polite">
        <div class="section-head">
          <div>
            <b>{{
              currentJob.message || "Preparing your prayer collection…"
            }}</b>
            <p class="muted">{{ currentJob.status }}</p>
          </div>
          <b>{{ currentJob.progress }}%</b>
        </div>
        <div class="progress">
          <span [style.width.%]="currentJob.progress"></span>
        </div>
      </section>
    }
    <main class="workspace">
      <div class="left">
        <app-prayer-brief-form
          [form]="form"
          [supporting]="supportingScriptures"
          [supportingInput]="supportingInput"
          (addSupporting)="addScripture()"
          (removeSupporting)="removeScripture($event)"
        />
      </div>
      <div class="right">
        <app-prayer-recent-work
          [items]="recent()"
          [selectedId]="record()?.id || null"
          [loading]="loadingRecent()"
          [error]="recentError()"
          (refresh)="loadRecent()"
          (selected)="select($event)"
        /><app-prayer-preview
          [record]="record()"
          (pointChanged)="savePoint($event)"
          (reordered)="reorder($event)"
          (pointAction)="pointAction($event)"
        />
        <div class="lower">
          <app-prayer-timeline
            [events]="timeline()"
            [loading]="loadingDetails()"
          /><app-prayer-version-history [versions]="versions()" />
        </div>
        <app-prayer-approval-panel
          [approval]="approval()"
          [status]="record()?.status || 'draft'"
          [busy]="busy()"
          (submit)="submitReview()"
          (newRevision)="createRevision()"
        />
      </div>
    </main>`,
})
export class PrayerCollectionPage implements OnInit {
  private readonly service = inject(PrayerService);
  private readonly jobs = inject(AiJobService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly recent = signal<readonly PrayerSummary[]>([]);
  readonly record = signal<PrayerRecord | null>(null);
  readonly timeline = signal<readonly PrayerTimelineEvent[]>([]);
  readonly versions = signal<readonly PrayerVersion[]>([]);
  readonly approval = signal<PrayerApproval | null>(null);
  readonly job = signal<PrayerJob | null>(null);
  readonly loadingRecent = signal(false);
  readonly loadingDetails = signal(false);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly reviewing = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly recentError = signal<string | null>(null);
  readonly serverRevision = signal<string | null>(null);
  readonly loadedSnapshot = signal<PrayerDraftForm | null>(null);
  readonly conflict = signal<PrayerDraftForm | null>(null);
  readonly busy = computed(
    () => this.saving() || this.generating() || this.reviewing(),
  );
  readonly approved = computed(() => this.record()?.status === "approved");
  readonly statusLabel = computed(() =>
    this.label(this.record()?.status || "draft"),
  );
  readonly form = new FormGroup({
    title: new FormControl("", { nonNullable: true }),
    quantity: new FormControl(20, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(100)],
    }),
    theme: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    primaryScripture: new FormGroup({
      book: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
      chapter: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      verses: new FormControl("", {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\d+(?:[-–]\d+)?$/),
        ],
      }),
    }),
    supportingScriptures: new FormArray<FormGroup>([]),
    category: new FormControl("Intercession", { nonNullable: true }),
    tone: new FormControl("Pastoral", { nonNullable: true }),
    advancedOptions: new FormGroup({
      includeScriptureText: new FormControl(true, { nonNullable: true }),
      includeDeclaration: new FormControl(true, { nonNullable: true }),
      includeCongregationalResponse: new FormControl(false, {
        nonNullable: true,
      }),
      includeIntroduction: new FormControl(true, { nonNullable: true }),
      includeClosingDeclaration: new FormControl(true, { nonNullable: true }),
      bibleTranslation: new FormControl("NKJV", { nonNullable: true }),
      audience: new FormControl("Congregation", { nonNullable: true }),
      serviceContext: new FormControl("", { nonNullable: true }),
      campaign: new FormControl("", { nonNullable: true }),
    }),
  });
  readonly supportingInput = this.scriptureGroup();
  get supportingScriptures() {
    return this.form.controls.supportingScriptures;
  }
  ngOnInit() {
    this.loadRecent();
    const id = this.route.snapshot.queryParamMap.get("prayer");
    if (id) this.load(id as EntityId);
  }
  addScripture() {
    if (this.supportingInput.invalid) {
      this.supportingInput.markAllAsTouched();
      return;
    }
    this.supportingScriptures.push(
      this.scriptureGroup(
        this.supportingInput.getRawValue() as ScriptureReference,
      ),
    );
    this.supportingInput.reset({ book: "", chapter: 1, verses: "" });
  }
  removeScripture(index: number) {
    this.supportingScriptures.removeAt(index);
  }
  loadRecent() {
    this.loadingRecent.set(true);
    this.recentError.set(null);
    this.service
      .list()
      .pipe(
        finalize(() => this.loadingRecent.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (p) => this.recent.set(p.items),
        error: (e) => this.recentError.set(this.error(e)),
      });
  }
  select(item: PrayerSummary) {
    this.load(item.id);
  }
  load(id: EntityId) {
    this.loadingDetails.set(true);
    this.message.set(null);
    forkJoin({
      record: this.service.get(id),
      timeline: this.service.timeline(id).pipe(catchError(() => of([]))),
      versions: this.service.versions(id).pipe(catchError(() => of([]))),
      approval: this.service.approval(id).pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => this.loadingDetails.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (data) => {
          this.apply(data.record);
          this.timeline.set(data.timeline);
          this.versions.set(data.versions);
          this.approval.set(data.approval);
          void this.router.navigate([], {
            queryParams: { prayer: id },
            queryParamsHandling: "merge",
            replaceUrl: true,
          });
        },
        error: (e) => this.fail(e),
      });
  }
  saveDraft() {
    this.persist().subscribe();
  }
  generate() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy() || this.approved()) return;
    this.generating.set(true);
    this.clearMessage();
    this.persist()
      .pipe(
        switchMap((record) =>
          this.service.generate(record.id, this.requireRevision()),
        ),
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
          if (job.status === "completed") {
            this.load((job.result?.prayerId || this.record()?.id) as EntityId);
            this.loadRecent();
          } else if (job.status === "failed" || job.status === "cancelled")
            this.fail(new Error(job.message || "Generation did not complete."));
        },
        error: (e) => this.fail(e),
      });
  }
  savePoint(point: PrayerPoint) {
    const current = this.record();
    if (!current || this.approved()) return;
    this.service
      .updatePoint(current.id, point)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.apply(r);
          this.success("Prayer point saved.");
        },
        error: (e) => this.fail(e),
      });
  }
  reorder(points: readonly PrayerPoint[]) {
    const current = this.record();
    if (!current || this.approved()) return;
    this.service
      .reorder(
        current.id,
        points.map((p) => p.id),
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (r) => this.apply(r), error: (e) => this.fail(e) });
  }
  pointAction(event: {
    point: PrayerPoint;
    action: "duplicate" | "delete" | "regenerate";
  }) {
    const current = this.record();
    if (!current || this.approved()) return;
    this.service
      .pointAction(current.id, event.point.id, event.action)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.load(current.id),
        error: (e) => this.fail(e),
      });
  }
  submitReview() {
    const current = this.record();
    if (!current?.currentVersionId) return;
    this.reviewing.set(true);
    this.service
      .submitReview(current.id, current.currentVersionId)
      .pipe(
        finalize(() => this.reviewing.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (r) => {
          this.apply(r);
          this.load(r.id);
          this.success("Version submitted for review.");
        },
        error: (e) => this.fail(e),
      });
  }
  createRevision() {
    const current = this.record();
    if (!current) return;
    this.service
      .createRevision(current.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          this.apply(r);
          this.success("A new editable revision is ready.");
        },
        error: (e) => this.fail(e),
      });
  }
  private persist(retried = false): Observable<PrayerRecord> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.fail(new Error("Review the highlighted prayer brief fields."));
      return of();
    }
    this.saving.set(true);
    this.clearMessage();
    const brief = this.form.getRawValue() as unknown as PrayerDraftForm;
    brief.title = prayerTitle(brief);
    const current = this.record();
    const revision = this.serverRevision();
    if (current && !revision) {
      this.fail(new Error("Reload this prayer collection before saving."));
      this.saving.set(false);
      return of();
    }
    const localChanged = !this.sameBrief(brief, this.loadedSnapshot());
    return (
      current
        ? this.service.save(current.id, brief, revision!)
        : this.service.create(brief)
    ).pipe(
      finalize(() => this.saving.set(false)),
      takeUntilDestroyed(this.destroyRef),
      switchMap((saved) => {
        this.apply(saved);
        this.success("Draft saved to SanctuaryAI.");
        this.loadRecent();
        return of(saved);
      }),
      catchError((e) => {
        if (current && e instanceof HttpErrorResponse && e.status === 409) {
          return this.service.get(current.id).pipe(
            switchMap((latest) => {
              this.serverRevision.set(latest.revisionToken);
              if (!localChanged && !retried) {
                this.apply(latest);
                return this.persist(true);
              }
              this.conflict.set(brief);
              this.message.set(
                "This prayer collection changed since you loaded it.",
              );
              this.isError.set(true);
              return of();
            }),
          );
        }
        this.fail(e);
        return of();
      }),
    );
  }
  private apply(value: PrayerRecord) {
    this.record.set(value);
    this.serverRevision.set(value.revisionToken);
    this.loadedSnapshot.set(structuredClone(value.brief));
    this.conflict.set(null);
    this.form.patchValue(value.brief);
    this.supportingScriptures.clear();
    for (const ref of value.brief.supportingScriptures || [])
      this.supportingScriptures.push(this.scriptureGroup(ref));
  }
  reloadConflict() {
    const id = this.record()?.id;
    if (id) this.load(id);
  }
  reviewConflict() {
    const local = this.conflict();
    const id = this.record()?.id;
    if (!local || !id) return;
    this.service.get(id).subscribe({
      next: (latest) => {
        this.apply(latest);
        this.form.patchValue(local);
        this.conflict.set(local);
        this.message.set(
          "Review your edits against the latest prayer collection before saving.",
        );
        this.isError.set(true);
      },
      error: (e) => this.fail(e),
    });
  }
  private requireRevision(): string {
    const revision = this.serverRevision();
    if (!revision)
      throw new Error("Reload this prayer collection before continuing.");
    return revision;
  }
  private sameBrief(a: PrayerDraftForm, b: PrayerDraftForm | null): boolean {
    return b !== null && JSON.stringify(a) === JSON.stringify(b);
  }
  private scriptureGroup(
    value: ScriptureReference = { book: "", chapter: 1, verses: "" },
  ) {
    return new FormGroup({
      book: new FormControl(value.book, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      chapter: new FormControl(value.chapter, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      verses: new FormControl(value.verses, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^\d+(?:[-–]\d+)?$/),
        ],
      }),
    });
  }
  private label(status: PrayerStatus) {
    return status.replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase());
  }
  private clearMessage() {
    this.message.set(null);
    this.isError.set(false);
  }
  private success(value: string) {
    this.message.set(value);
    this.isError.set(false);
  }
  private fail(e: unknown) {
    this.message.set(this.error(e));
    this.isError.set(true);
  }
  private error(e: unknown) {
    return e instanceof HttpErrorResponse
      ? e.error?.detail ||
          e.error?.message ||
          "The request could not be completed."
      : e instanceof Error
        ? e.message
        : "The request could not be completed.";
  }
}
