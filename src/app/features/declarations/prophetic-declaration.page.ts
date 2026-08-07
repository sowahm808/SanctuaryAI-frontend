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
import { DeclarationBriefFormComponent } from "./declaration-brief-form.component";
import { DeclarationRecentWorkComponent } from "./declaration-recent-work.component";
import { DeclarationPreviewComponent } from "./declaration-preview.component";
import { DeclarationVariantEditorComponent } from "./declaration-variant-editor.component";
import {
  DeclarationApprovalPanelComponent,
  DeclarationTimelineComponent,
  DeclarationVersionHistoryComponent,
} from "./declaration-workflow-panels.component";
import type {
  DeclarationApproval,
  DeclarationDraftForm,
  DeclarationJob,
  DeclarationRecord,
  DeclarationSummary,
  DeclarationTimelineEvent,
  DeclarationVariant,
  DeclarationVersion,
  RefineAction,
  ScriptureReference,
} from "./declaration.models";
import { declarationTitle, statusLabel } from "./declaration.models";
import { DeclarationService } from "./declaration.service";
@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DeclarationBriefFormComponent,
    DeclarationRecentWorkComponent,
    DeclarationPreviewComponent,
    DeclarationVariantEditorComponent,
    DeclarationTimelineComponent,
    DeclarationVersionHistoryComponent,
    DeclarationApprovalPanelComponent,
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
        grid-template-columns: minmax(340px, 430px) minmax(0, 1fr);
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
      .notice {
        border-left: 4px solid var(--green);
        margin-bottom: 1rem;
      }
      .notice.error {
        border-color: var(--danger);
        color: var(--danger);
      }
      .progress {
        height: 8px;
        background: #e9e4f6;
        border-radius: 8px;
        overflow: hidden;
      }
      .progress span {
        display: block;
        height: 100%;
        background: var(--violet);
      }
      @media (max-width: 960px) {
        .workspace {
          grid-template-columns: 1fr;
        }
        .left,
        .right {
          display: contents;
        }
        .lower {
          display: contents;
        }
        app-declaration-brief-form {
          order: 1;
        }
        app-declaration-recent-work {
          order: 2;
        }
        app-declaration-preview {
          order: 3;
        }
        app-declaration-variant-editor {
          order: 4;
        }
        app-declaration-timeline {
          order: 5;
        }
        app-declaration-version-history {
          order: 6;
        }
        app-declaration-approval-panel {
          order: 7;
        }
      }
      @media (max-width: 620px) {
        .hero {
          align-items: flex-start;
          flex-direction: column;
        }
        .actions {
          width: 100%;
        }
        .actions button {
          flex: 1;
        }
      }
    `,
  ],
  template: `<header class="hero">
      <div>
        <p class="eyebrow">Content workflow</p>
        <div class="title-row">
          <h1>Prophetic declaration studio</h1>
          <span class="badge">{{ status() }}</span>
        </div>
        <p class="muted">
          Create scripture-grounded declarations, ministry-ready variants, and
          governed approvals.
        </p>
      </div>
      <div class="actions">
        <button
          class="btn secondary"
          [disabled]="busy() || approved()"
          (click)="saveDraft()"
        >
          {{ saving() ? "Saving…" : "Save draft" }}</button
        ><button
          class="btn"
          [disabled]="busy() || approved()"
          (click)="generate()"
        >
          ✦ {{ generating() ? "Generating…" : "Generate declaration" }}
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
        <b>This declaration changed since you loaded it.</b>
        <p>
          Reload the server version, or review and manually reapply your unsaved
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
    @if (job(); as j) {
      <section class="card notice" aria-live="polite">
        <div class="section-head">
          <b>{{ j.message || "Preparing declaration…" }}</b
          ><b>{{ j.progress }}%</b>
        </div>
        <div class="progress"><span [style.width.%]="j.progress"></span></div>
      </section>
    }
    <main class="workspace">
      <div class="left">
        <app-declaration-brief-form
          [form]="form"
          [supporting]="supportingScriptures"
          [supportingInput]="supportingInput"
          (addSupporting)="addScripture()"
          (removeSupporting)="removeScripture($event)"
        />
      </div>
      <div class="right">
        <app-declaration-recent-work
          [items]="recent()"
          [selectedId]="record()?.id || null"
          [loading]="loadingRecent()"
          [error]="recentError()"
          (refresh)="loadRecent()"
          (selected)="load($event)"
        /><app-declaration-preview
          [record]="record()"
        /><app-declaration-variant-editor
          [variants]="record()?.variants || []"
          (save)="saveVariant($event)"
          (action)="variantAction($event)"
          (refine)="refine($event)"
        />
        <div class="lower">
          <app-declaration-timeline
            [events]="timeline()"
            [loading]="loadingTimeline()"
          /><app-declaration-version-history
            [versions]="versions()"
            [loading]="loadingVersions()"
            [changes]="comparison()"
            (compare)="compare($event)"
          />
        </div>
        <app-declaration-approval-panel
          [approval]="approval()"
          [status]="record()?.status || 'draft'"
          [busy]="busy()"
          (submit)="submitReview()"
          (newRevision)="createRevision()"
        />
      </div>
    </main>`,
})
export class PropheticDeclarationPage implements OnInit {
  private service = inject(DeclarationService);
  private jobs = inject(AiJobService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly recent = signal<readonly DeclarationSummary[]>([]);
  readonly record = signal<DeclarationRecord | null>(null);
  readonly timeline = signal<readonly DeclarationTimelineEvent[]>([]);
  readonly versions = signal<readonly DeclarationVersion[]>([]);
  readonly approval = signal<DeclarationApproval | null>(null);
  readonly comparison = signal<readonly string[]>([]);
  readonly job = signal<DeclarationJob | null>(null);
  readonly loadingRecent = signal(false);
  readonly loadingDeclaration = signal(false);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly loadingPreview = signal(false);
  readonly loadingTimeline = signal(false);
  readonly loadingVersions = signal(false);
  readonly submittingReview = signal(false);
  readonly message = signal<string | null>(null);
  readonly isError = signal(false);
  readonly recentError = signal<string | null>(null);
  readonly serverRevision = signal<string | null>(null);
  readonly loadedSnapshot = signal<DeclarationDraftForm | null>(null);
  readonly conflict = signal<DeclarationDraftForm | null>(null);
  readonly busy = computed(
    () => this.saving() || this.generating() || this.submittingReview(),
  );
  readonly approved = computed(() => this.record()?.status === "approved");
  readonly status = computed(() =>
    statusLabel(this.record()?.status || "draft"),
  );
  readonly form = new FormGroup({
    title: new FormControl("", { nonNullable: true }),
    declarationType: new FormControl("Prophetic", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    primaryScripture: new FormGroup({
      reference: new FormControl("", {
        nonNullable: true,
        validators: [Validators.required],
      }),
    }),
    supportingScriptures: new FormArray<FormGroup>([]),
    tone: new FormControl("Prophetic", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    audience: new FormControl<string[]>(["Entire congregation"], {
      nonNullable: true,
      validators: [Validators.required],
    }),
    serviceContext: new FormGroup({
      serviceType: new FormControl("", { nonNullable: true }),
      event: new FormControl("", { nonNullable: true }),
      occasion: new FormControl("", { nonNullable: true }),
      date: new FormControl<Date | null>(null),
      notes: new FormControl("", { nonNullable: true }),
    }),
    objective: new FormControl("", { nonNullable: true }),
    advancedOptions: new FormGroup({
      length: new FormControl("standard", { nonNullable: true }),
      includeScriptureQuotations: new FormControl(true, { nonNullable: true }),
      includeCongregationalResponse: new FormControl(true, {
        nonNullable: true,
      }),
      includeAmenResponse: new FormControl(true, { nonNullable: true }),
      includeSocialVersion: new FormControl(false, { nonNullable: true }),
      includeFlyerVersion: new FormControl(false, { nonNullable: true }),
      includeVideoVoiceoverVersion: new FormControl(false, {
        nonNullable: true,
      }),
      includePersonalVersion: new FormControl(false, { nonNullable: true }),
      includeCongregationalVersion: new FormControl(true, {
        nonNullable: true,
      }),
    }),
  });
  readonly supportingInput = this.scriptureGroup();
  get supportingScriptures() {
    return this.form.controls.supportingScriptures;
  }
  ngOnInit() {
    this.loadRecent();
    const id =
      this.route.snapshot.queryParamMap.get("declaration") ||
      localStorage.getItem("sanctuary:selectedDeclaration");
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
    this.supportingInput.reset({ reference: "" });
  }
  removeScripture(i: number) {
    this.supportingScriptures.removeAt(i);
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
  load(id: EntityId) {
    this.loadingDeclaration.set(true);
    this.loadingPreview.set(true);
    this.loadingTimeline.set(true);
    this.loadingVersions.set(true);
    forkJoin({
      record: this.service.get(id),
      timeline: this.service.timeline(id).pipe(catchError(() => of([]))),
      versions: this.service.versions(id).pipe(catchError(() => of([]))),
      approval: this.service.approval(id).pipe(catchError(() => of(null))),
    })
      .pipe(
        finalize(() => {
          this.loadingDeclaration.set(false);
          this.loadingPreview.set(false);
          this.loadingTimeline.set(false);
          this.loadingVersions.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (d) => {
          this.apply(d.record);
          this.timeline.set(d.timeline);
          this.versions.set(d.versions);
          this.approval.set(d.approval);
          localStorage.setItem("sanctuary:selectedDeclaration", id);
          void this.router.navigate([], {
            queryParams: { declaration: id },
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
    if (this.busy() || this.approved()) return;
    this.generating.set(true);
    this.persist()
      .pipe(
        switchMap((r) => this.service.generate(r.id, this.requireRevision())),
        switchMap((j) => {
          this.job.set(j);
          return this.jobs.watch(j);
        }),
        finalize(() => this.generating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (j) => {
          this.job.set(j);
          if (j.status === "completed") {
            this.load(
              (j.result?.declarationId || this.record()?.id) as EntityId,
            );
            this.loadRecent();
          } else if (j.status === "failed" || j.status === "cancelled")
            this.fail(new Error(j.message || "Generation did not complete."));
        },
        error: (e) => this.fail(e),
      });
  }
  saveVariant(v: DeclarationVariant) {
    const r = this.record();
    if (!r || this.approved()) return;
    this.service
      .updateVariant(r.id, v)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (x) => {
          this.apply(x);
          this.success("Variant saved.");
        },
        error: (e) => this.fail(e),
      });
  }
  variantAction(e: {
    variant: DeclarationVariant;
    action: "duplicate" | "regenerate";
  }) {
    const r = this.record();
    if (!r || this.approved()) return;
    this.service
      .variantAction(r.id, e.variant.id, e.action)
      .subscribe({ next: () => this.load(r.id), error: (x) => this.fail(x) });
  }
  refine(e: { variant: DeclarationVariant; action: RefineAction }) {
    const r = this.record();
    if (!r || this.approved()) return;
    this.generating.set(true);
    this.service
      .refine(r.id, e.variant.kind, e.action)
      .pipe(
        switchMap((j) => this.jobs.watch(j)),
        finalize(() => this.generating.set(false)),
      )
      .subscribe({
        next: (j) => {
          this.job.set(j);
          if (j.status === "completed") this.load(r.id);
        },
        error: (x) => this.fail(x),
      });
  }
  submitReview() {
    const r = this.record();
    if (!r?.currentVersionId) return;
    this.submittingReview.set(true);
    this.service
      .submitReview(r.id, r.currentVersionId)
      .pipe(finalize(() => this.submittingReview.set(false)))
      .subscribe({
        next: () => {
          this.load(r.id);
          this.success("Version submitted for review.");
        },
        error: (e) => this.fail(e),
      });
  }
  createRevision() {
    const r = this.record();
    if (!r) return;
    this.service.createRevision(r.id).subscribe({
      next: (x) => {
        this.apply(x);
        this.load(x.id);
        this.success("A new editable revision is ready.");
      },
      error: (e) => this.fail(e),
    });
  }
  compare(ids: readonly string[]) {
    const r = this.record();
    if (!r || ids.length !== 2) return;
    this.service
      .compare(r.id, ids[0] as EntityId, ids[1] as EntityId)
      .subscribe({
        next: (x) => this.comparison.set(x),
        error: (e) => this.fail(e),
      });
  }
  private persist(retried = false): Observable<DeclarationRecord> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.fail(new Error("Review the highlighted declaration brief fields."));
      return of();
    }
    this.saving.set(true);
    const raw = this.form.getRawValue() as any;
    const brief = {
      ...raw,
      serviceContext: {
        ...raw.serviceContext,
        date:
          raw.serviceContext.date instanceof Date
            ? raw.serviceContext.date.toISOString()
            : raw.serviceContext.date,
      },
    } as DeclarationDraftForm;
    brief.title = declarationTitle({ brief });
    const r = this.record();
    const revision = this.serverRevision();
    if (r && !revision) {
      this.fail(new Error("Reload this declaration before saving."));
      this.saving.set(false);
      return of();
    }
    const localChanged = !this.sameBrief(brief, this.loadedSnapshot());
    return (
      r ? this.service.save(r.id, brief, revision!) : this.service.create(brief)
    ).pipe(
      finalize(() => this.saving.set(false)),
      switchMap((x) => {
        this.apply(x);
        this.loadRecent();
        this.success("Draft saved to SanctuaryAI.");
        return of(x);
      }),
      catchError((e) => {
        if (r && e instanceof HttpErrorResponse && e.status === 409) {
          return this.service.get(r.id).pipe(
            switchMap((latest) => {
              this.serverRevision.set(latest.revisionToken);
              if (!localChanged && !retried) {
                this.apply(latest);
                return this.persist(true);
              }
              this.conflict.set(brief);
              this.message.set("This declaration changed since you loaded it.");
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
  private apply(r: DeclarationRecord) {
    this.record.set(r);
    this.serverRevision.set(r.revisionToken);
    this.loadedSnapshot.set(structuredClone(r.brief));
    this.conflict.set(null);
    this.form.patchValue({
      ...r.brief,
      serviceContext: {
        ...r.brief.serviceContext,
        date: r.brief.serviceContext.date
          ? new Date(r.brief.serviceContext.date)
          : null,
      },
    } as any);
    this.supportingScriptures.clear();
    for (const s of r.brief.supportingScriptures || [])
      this.supportingScriptures.push(this.scriptureGroup(s));
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
        this.form.patchValue(local as any);
        this.conflict.set(local);
        this.message.set(
          "Review your edits against the latest declaration before saving.",
        );
        this.isError.set(true);
      },
      error: (e) => this.fail(e),
    });
  }
  private requireRevision(): string {
    const revision = this.serverRevision();
    if (!revision)
      throw new Error("Reload this declaration before continuing.");
    return revision;
  }
  private sameBrief(
    a: DeclarationDraftForm,
    b: DeclarationDraftForm | null,
  ): boolean {
    return b !== null && JSON.stringify(a) === JSON.stringify(b);
  }
  private scriptureGroup(v: ScriptureReference = { reference: "" }) {
    return new FormGroup({
      reference: new FormControl(v.reference, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.pattern(/^[1-3]?\s?[A-Za-z ]+\s\d+(?::\d+(?:[-–]\d+)?)?$/),
        ],
      }),
    });
  }
  private success(s: string) {
    this.message.set(s);
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
