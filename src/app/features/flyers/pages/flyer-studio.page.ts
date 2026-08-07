import { HttpErrorResponse } from "@angular/common/http";
import {
  AfterViewInit,
  Component,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { catchError, forkJoin, of, tap } from "rxjs";
import {
  emptyBrief,
  type BrandKitView,
  type FlyerApprovalView,
  type FlyerBrief,
  type FlyerProjectView,
  type FlyerSummaryView,
  type FlyerTemplateView,
  type FlyerTimelineView,
  type FlyerVariantView,
  type FlyerVersionView,
  type MediaAssetView,
  type FlyerSize,
} from "../flyer.models";
import { FlyerHeaderComponent } from "../components/flyer-header/flyer-header.component";
import { FlyerBriefComponent } from "../components/flyer-brief/flyer-brief.component";
import { FlyerCanvasComponent } from "../components/flyer-canvas/flyer-canvas.component";
import { FlyerToolbarComponent } from "../components/flyer-toolbar/flyer-toolbar.component";
import {
  FlyerAssetPickerComponent,
  FlyerBrandKitComponent,
  FlyerExportPanelComponent,
  FlyerLayerPanelComponent,
  FlyerRecentWorkComponent,
  FlyerRenderVariantsComponent,
  FlyerTemplateGalleryComponent,
  FlyerWorkflowPanelsComponent,
} from "../components/flyer-panels.component";
import { FlyerApiService } from "../services/flyer-api.service";
import { FlyerAutosaveService } from "../services/flyer-autosave.service";
import { FlyerCanvasService } from "../services/flyer-canvas.service";
import { FlyerRecoveryService } from "../services/flyer-recovery.service";
import { FlyerRenderService } from "../services/flyer-render.service";
import { FlyerShortcutsService } from "../services/flyer-shortcuts.service";
@Component({
  standalone: true,
  imports: [
    FlyerHeaderComponent,
    FlyerBriefComponent,
    FlyerCanvasComponent,
    FlyerToolbarComponent,
    FlyerTemplateGalleryComponent,
    FlyerLayerPanelComponent,
    FlyerBrandKitComponent,
    FlyerAssetPickerComponent,
    FlyerRecentWorkComponent,
    FlyerWorkflowPanelsComponent,
    FlyerRenderVariantsComponent,
    FlyerExportPanelComponent,
  ],
  template: ` <app-flyer-header
      [workflow]="project()?.status || 'draft'"
      [render]="project()?.renderStatus || 'not_rendered'"
      [dirty]="canvas.dirty()"
      [saving]="saving()"
      [generating]="generating()"
      [canReview]="canReview()"
      (save)="save()"
      (generate)="generate()"
      (review)="submitReview()"
      (openExport)="exportOpen.set(!exportOpen())"
    />
    @if (conflict()) {
      <div class="conflict" role="alert">
        <strong>Server conflict detected.</strong> Your unsaved canvas is
        preserved. The server has a newer revision.
        <button (click)="reloadAfterConflict()">Load server version</button>
      </div>
    }
    @if (recoveryMessage()) {
      <div class="recovery" role="status">
        {{ recoveryMessage() }}
        @if (canRestoreRecovery()) {
          <button (click)="restoreRecovery()">Restore unsaved work</button>
        }
      </div>
    }
    <div class="studio">
      <aside class="left panel">
        <app-flyer-brief
          #brief
          [value]="briefValue()"
          (changed)="briefChanged($event)"
        /><app-flyer-template-gallery
          [templates]="templates"
          [activeId]="project()?.templateId"
          (selected)="applyTemplate($event)"
        /><app-flyer-brand-kit
          [brand]="brand()"
          (apply)="applyBrand()"
        /><app-flyer-asset-picker
          [assets]="assets()"
          (insert)="insertAsset($event)"
          (upload)="upload($event)"
        />
      </aside>
      <main>
        <app-flyer-toolbar
          [zoom]="canvas.zoom()"
          [size]="size()"
          [imageSelected]="canvas.isImageSelected()"
          (action)="tool($event)"
          (qr)="addQr()"
          (zoomChange)="canvas.setZoom($event)"
          (sizeChange)="resize($event)"
        /><app-flyer-canvas [width]="canvasWidth()" [height]="canvasHeight()" />
        <p class="announce" aria-live="polite">{{ canvas.announcement() }}</p>
        <app-flyer-render-variants [variants]="variants()" />
        @if (exportOpen()) {
          <app-flyer-export-panel
            [variants]="variants()"
            [dirty]="canvas.dirty()"
            (exported)="requestExport($event)"
          />
        }
      </main>
      <aside class="right panel">
        <app-flyer-recent-work
          [items]="recent()"
          [error]="recentError()"
          (selected)="openProject($event)"
        /><app-flyer-layer-panel
          [layers]="canvas.layers()"
          (select)="canvas.selectLayer($event)"
          (visibility)="canvas.toggleVisible($event)"
          (lock)="canvas.toggleLock($event)"
        /><app-flyer-workflow-panels
          [versions]="versions()"
          [timeline]="timeline()"
          [approval]="approval()"
          [versionsError]="versionsError()"
          [timelineError]="timelineError()"
          [approvalError]="approvalError()"
        />
      </aside>
    </div>`,
  styles: [
    `
      :host {
        display: block;
      }
      .studio {
        display: grid;
        grid-template-columns: minmax(230px, 280px) minmax(420px, 1fr) minmax(
            230px,
            280px
          );
        gap: 1rem;
        align-items: start;
      }
      .panel {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 1rem;
        max-height: calc(100vh - 150px);
        overflow: auto;
      }
      .left section + section,
      .right section + section {
        border-top: 1px solid var(--line);
        padding-top: 0.8rem;
        margin-top: 0.8rem;
      }
      .announce {
        text-align: center;
        color: #667085;
      }
      .conflict,
      .recovery {
        padding: 0.75rem;
        margin-bottom: 0.7rem;
        border-radius: 10px;
      }
      .conflict {
        background: #fff1f0;
        border: 1px solid #fda29b;
      }
      .recovery {
        background: #f4f0ff;
        border: 1px solid #b9a6ee;
      }
      @media (max-width: 1100px) {
        .studio {
          grid-template-columns: 240px minmax(400px, 1fr);
        }
        .right {
          grid-column: 1/-1;
          max-height: none;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
      }
      @media (max-width: 700px) {
        .studio {
          display: flex;
          flex-direction: column;
        }
        .panel,
        .left,
        main,
        .right {
          width: 100%;
          max-height: none;
        }
        .left {
          order: 1;
        }
        main {
          order: 2;
        }
        .right {
          order: 3;
          display: block;
        }
      }
    `,
  ],
})
export class FlyerStudioPage implements OnInit, AfterViewInit {
  readonly canvas = inject(FlyerCanvasService);
  private api = inject(FlyerApiService);
  private autosave = inject(FlyerAutosaveService);
  private renderService = inject(FlyerRenderService);
  private recovery = inject(FlyerRecoveryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private shortcuts = inject(FlyerShortcutsService);
  readonly briefComponent = viewChild<FlyerBriefComponent>("brief");
  readonly project = signal<FlyerProjectView | null>(null);
  readonly briefValue = signal<FlyerBrief>(emptyBrief());
  readonly recent = signal<FlyerSummaryView[]>([]);
  readonly variants = signal<FlyerVariantView[]>([]);
  readonly versions = signal<FlyerVersionView[]>([]);
  readonly timeline = signal<FlyerTimelineView[]>([]);
  readonly approval = signal<FlyerApprovalView | null>(null);
  readonly assets = signal<MediaAssetView[]>([]);
  readonly brand = signal<BrandKitView | null>(null);
  readonly saving = signal(false);
  readonly generating = signal(false);
  readonly conflict = signal(false);
  readonly exportOpen = signal(false);
  readonly recentError = signal(false);
  readonly versionsError = signal(false);
  readonly timelineError = signal(false);
  readonly approvalError = signal(false);
  readonly recoveryMessage = signal("");
  readonly canRestoreRecovery = signal(false);
  private recovered: Awaited<ReturnType<FlyerRecoveryService["get"]>>;
  readonly size = signal<FlyerSize>("1080x1350");
  readonly customWidth = signal(1080);
  readonly customHeight = signal(1350);
  readonly dimensions = computed(() => this.resolveDimensions(this.size()));
  readonly canvasWidth = computed(() => Math.round(this.dimensions()[0] / 2));
  readonly canvasHeight = computed(() => Math.round(this.dimensions()[1] / 2));
  readonly templates: readonly FlyerTemplateView[] = [
    this.template("modern-service", "sunday_service", "Modern Service", [
      "#1d2939",
      "#fdb022",
      "#fff",
    ]),
    this.template("revival", "revival", "Revival", [
      "#3b0764",
      "#db2777",
      "#fff",
    ]),
    this.template("conference", "conference", "Conference", [
      "#101828",
      "#7f56d9",
      "#fef0c7",
    ]),
    this.template("prayer", "prayer_meeting", "Prayer Night", [
      "#0b4a6f",
      "#36bffa",
      "#fff",
    ]),
  ];
  readonly canReview = computed(
    () =>
      !!this.project() &&
      !this.canvas.dirty() &&
      this.project()?.renderStatus === "ready" &&
      !!this.versions().length &&
      !!this.briefValue().title.trim(),
  );
  constructor() {
    effect(() => {
      this.canvas.changeVersion();
      const project = this.project();
      if (!project || !this.canvas.dirty() || this.conflict()) return;
      this.autosave.schedule(() =>
        this.api
          .save(project.id, {
            expectedRevision: project.revisionToken,
            brief: this.briefValue(),
            editorJson: this.canvas.serialize(),
            selectedSize: this.size(),
            customWidth: this.customWidth(),
            customHeight: this.customHeight(),
            assetIds: project.assetIds,
          })
          .pipe(
            tap((saved) => this.acceptSaved(saved)),
            catchError((error) => {
              this.handleSaveError(error);
              return of(null);
            }),
          ),
      );
    });
  }
  ngOnInit() {
    this.loadSupporting();
    this.route.queryParamMap.subscribe((q) => {
      const id = q.get("flyer");
      if (id) this.load(id);
    });
  }
  ngAfterViewInit() {
    if (!this.route.snapshot.queryParamMap.get("flyer"))
      setTimeout(() => this.canvas.seed(this.templates[0], "", ""));
  }
  @HostListener("window:keydown", ["$event"]) key(event: KeyboardEvent) {
    this.shortcuts.handle(event);
  }
  briefChanged(value: FlyerBrief) {
    this.briefValue.set({
      ...value,
      supportingScriptures: [...(value.supportingScriptures ?? [])],
    });
    this.canvas.dirty.set(true);
  }
  save() {
    if (this.saving()) return;
    this.saving.set(true);
    const p = this.project();
    const body = {
      brief: this.briefValue(),
      editorJson: this.canvas.serialize(),
      selectedSize: this.size(),
      customWidth: this.customWidth(),
      customHeight: this.customHeight(),
      assetIds: p?.assetIds ?? [],
    };
    const request = p
      ? this.api.save(p.id, { ...body, expectedRevision: p.revisionToken })
      : this.api.create(body);
    request.subscribe({
      next: (saved) => {
        this.acceptSaved(saved);
        void this.router.navigate([], {
          queryParams: { flyer: saved.id },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
        this.loadSecondary(saved.id);
      },
      error: (e) => this.handleSaveError(e),
      complete: () => this.saving.set(false),
    });
  }
  generate() {
    this.saveThen(() => {
      const p = this.project();
      if (!p) return;
      this.generating.set(true);
      this.renderService.render(p.id, p.revisionToken).subscribe({
        next: () => {
          this.generating.set(false);
          this.load(p.id);
        },
        error: () => this.generating.set(false),
      });
    });
  }
  submitReview() {
    const p = this.project(),
      v = this.versions().at(0);
    if (!p || !v || !this.canReview()) return;
    this.api.submitReview(p.id, v.id).subscribe((saved) => {
      this.acceptSaved(saved);
      this.loadSecondary(saved.id);
    });
  }
  requestExport(req: {
    variantId: string;
    format: "png" | "jpg" | "webp" | "pdf";
  }) {
    const p = this.project();
    if (!p || this.canvas.dirty()) return;
    this.renderService
      .export(p.id, req.variantId, req.format)
      .subscribe({ next: () => this.loadSecondary(p.id) });
  }
  openProject(id: string) {
    void this.router.navigate([], {
      queryParams: { flyer: id },
      queryParamsHandling: "merge",
    });
  }
  tool(action: string) {
    const c = this.canvas;
    (
      ({
        undo: () => c.undo(),
        redo: () => c.redo(),
        text: () => c.addText(),
        shape: () => c.addShape(),
        duplicate: () => c.duplicate(),
        group: () => c.group(),
        ungroup: () => c.ungroup(),
        center: () => c.alignCenter(),
        delete: () => c.removeSelected(),
        gradient: () =>
          c.applyGradient(
            this.brand()?.primaryColors ?? ["#7457cb", "#fdb022"],
          ),
        crop: () => c.cropSelected(),
      })[action] ?? (() => {})
    )();
  }
  addQr() {
    const target = window.prompt(
      "Enter the website, giving, or registration URL",
    );
    if (!target) return;
    try {
      new URL(target);
    } catch {
      return;
    }
    this.api.qrCode(target).subscribe((asset) => {
      this.assets.update((x) => [asset, ...x]);
      void this.canvas.addQrCode(asset, target);
    });
  }
  insertAsset(asset: MediaAssetView) {
    void this.canvas.addImage(asset);
    this.addAssetId(asset.id);
  }
  upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.api.upload(file).subscribe((asset) => {
      this.assets.update((x) => [asset, ...x]);
      void this.canvas.addImage(asset);
      this.addAssetId(asset.id);
    });
  }
  applyBrand() {
    const b = this.brand();
    if (b) this.canvas.applyBrandKit(b);
  }
  applyTemplate(t: FlyerTemplateView) {
    this.canvas.seed(t, this.briefValue().title, this.details());
    this.project.update((p) => (p ? { ...p, templateId: t.id } : p));
  }
  resize(size: FlyerSize) {
    this.size.set(size);
    const [w, h] = this.resolveDimensions(size);
    this.canvas.resize(Math.round(w / 2), Math.round(h / 2));
  }
  restoreRecovery() {
    if (this.recovered) {
      this.briefValue.set(this.recovered.unsavedFormState);
      this.briefComponent()?.setValue(this.recovered.unsavedFormState);
      void this.canvas.deserialize(this.recovered.canvasJson, true);
      this.canRestoreRecovery.set(false);
      this.recoveryMessage.set(
        "Recovered edits loaded. Save to synchronize them with the server.",
      );
    }
  }
  reloadAfterConflict() {
    const id = this.project()?.id;
    if (id) {
      this.conflict.set(false);
      this.load(id);
    }
  }
  private load(id: string) {
    this.api.get(id).subscribe({
      next: (p) => {
        this.project.set(p);
        this.briefValue.set(this.toBrief(p));
        this.briefComponent()?.setValue(this.toBrief(p));
        this.size.set(p.selectedSize);
        void this.canvas.deserialize(p.canvasJson ?? {}, false);
        this.checkRecovery(p);
        this.loadSecondary(id);
      },
      error: () =>
        this.recoveryMessage.set(
          "The server flyer could not be loaded. Local recovery has not replaced it.",
        ),
    });
  }
  private loadSupporting() {
    this.api
      .list()
      .pipe(
        catchError(() => {
          this.recentError.set(true);
          return of([]);
        }),
      )
      .subscribe((x) => this.recent.set(x));
    this.api
      .brandKit()
      .pipe(catchError(() => of(null)))
      .subscribe((x) => this.brand.set(x));
    this.api
      .media()
      .pipe(catchError(() => of([])))
      .subscribe((x) => this.assets.set(x));
  }
  private loadSecondary(id: string) {
    this.versionsError.set(false);
    this.timelineError.set(false);
    this.approvalError.set(false);
    this.api
      .variants(id)
      .pipe(catchError(() => of([])))
      .subscribe((x) => this.variants.set(x));
    this.api
      .versions(id)
      .pipe(
        catchError(() => {
          this.versionsError.set(true);
          return of([]);
        }),
      )
      .subscribe((x) => this.versions.set(x));
    this.api
      .timeline(id)
      .pipe(
        catchError(() => {
          this.timelineError.set(true);
          return of([]);
        }),
      )
      .subscribe((x) => this.timeline.set(x));
    this.api
      .approval(id)
      .pipe(
        catchError(() => {
          this.approvalError.set(true);
          return of(null);
        }),
      )
      .subscribe((x) => this.approval.set(x));
    this.api
      .list()
      .pipe(catchError(() => of(this.recent())))
      .subscribe((x) => this.recent.set(x));
  }
  private acceptSaved(saved: FlyerProjectView) {
    this.project.set(saved);
    this.canvas.markSaved();
    this.conflict.set(false);
    void this.recovery.put({
      flyerId: saved.id,
      lastKnownServerRevision: saved.revisionToken,
      savedAt: new Date().toISOString(),
      canvasJson: this.canvas.serialize(),
      unsavedFormState: this.briefValue(),
    });
  }
  private handleSaveError(error: unknown) {
    this.saving.set(false);
    const p = this.project();
    if (p)
      void this.recovery.put({
        flyerId: p.id,
        lastKnownServerRevision: p.revisionToken,
        savedAt: new Date().toISOString(),
        canvasJson: this.canvas.serialize(),
        unsavedFormState: this.briefValue(),
      });
    if (error instanceof HttpErrorResponse && error.status === 409) {
      this.conflict.set(true);
      this.recoveryMessage.set(
        "Unsaved local edits are stored for recovery. They were not sent over the newer server revision.",
      );
    }
  }
  private async checkRecovery(p: FlyerProjectView) {
    this.recovered = await this.recovery.get(p.id);
    if (!this.recovered) return;
    if (this.recovered.lastKnownServerRevision === p.revisionToken) {
      this.recoveryMessage.set(
        "Unsaved recovery data is available for this server revision.",
      );
      this.canRestoreRecovery.set(true);
    } else {
      this.recoveryMessage.set(
        "Recovery conflict: the server is newer. Recovery was retained but will not be applied automatically.",
      );
      this.canRestoreRecovery.set(false);
    }
  }
  private saveThen(done: () => void) {
    if (this.canvas.dirty() || !this.project()) {
      this.saving.set(true);
      const p = this.project();
      const body = {
        brief: this.briefValue(),
        editorJson: this.canvas.serialize(),
        selectedSize: this.size(),
        customWidth: this.customWidth(),
        customHeight: this.customHeight(),
        assetIds: p?.assetIds ?? [],
      };
      const req = p
        ? this.api.save(p.id, { ...body, expectedRevision: p.revisionToken })
        : this.api.create(body);
      req.subscribe({
        next: (s) => {
          this.acceptSaved(s);
          done();
        },
        error: (e) => this.handleSaveError(e),
        complete: () => this.saving.set(false),
      });
    } else done();
  }
  private addAssetId(id: string) {
    this.project.update((p) =>
      p ? { ...p, assetIds: [...new Set([...p.assetIds, id])] } : p,
    );
  }
  private toBrief(p: FlyerProjectView): FlyerBrief {
    const {
      title,
      subtitle,
      flyerType,
      campaignId,
      linkedResourceType,
      linkedResourceId,
      primaryScripture,
      supportingScriptures,
      eventDate,
      eventTime,
      venue,
      speaker,
      cta,
      audience,
      website,
      contact,
      notes,
    } = p;
    return {
      title,
      subtitle,
      flyerType,
      campaignId,
      linkedResourceType,
      linkedResourceId,
      primaryScripture,
      supportingScriptures: supportingScriptures ?? [],
      eventDate,
      eventTime,
      venue,
      speaker,
      cta,
      audience,
      website,
      contact,
      notes,
    };
  }
  private details() {
    const b = this.briefValue();
    return [b.eventDate, b.eventTime, b.venue, this.brand()?.churchName]
      .filter(Boolean)
      .join(" · ");
  }
  private resolveDimensions(size: FlyerSize): readonly [number, number] {
    const map: Record<
      Exclude<FlyerSize, "Custom">,
      readonly [number, number]
    > = {
      "1080x1080": [1080, 1080],
      "1080x1350": [1080, 1350],
      "1080x1920": [1080, 1920],
      "1200x630": [1200, 630],
      "1920x1080": [1920, 1080],
      A4: [1240, 1754],
      Letter: [1275, 1650],
    };
    return size === "Custom"
      ? [this.customWidth(), this.customHeight()]
      : map[size];
  }
  private template(
    id: string,
    flyerType: FlyerTemplateView["flyerType"],
    name: string,
    palette: string[],
  ): FlyerTemplateView {
    return {
      id,
      flyerType,
      name,
      tags: [flyerType],
      palette,
      supportedSizes: ["1080x1080", "1080x1350", "1080x1920"],
      category: "Featured",
      description: `A polished ${name.toLowerCase()} layout`,
      brandCompatible: true,
    };
  }
}
