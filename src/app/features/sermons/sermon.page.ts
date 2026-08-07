import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { openDB } from "idb";
import type { EntityId } from "../../models/domain.models";
import { PlatformStateService } from "../../services/platform-state.service";
import {
  SermonService,
  type SermonDraftRequest,
  type SermonRecord,
} from "./sermon.service";
import { ApprovalService } from "../reviews/approval.service";

type SermonStatus = "Draft" | "Awaiting Approval" | "Approved" | "Published";
type SermonDuration = 15 | 30 | 45 | 60 | 90;
type SaveState =
  | "Recovered draft"
  | "Unsaved changes"
  | "Saving locally…"
  | "Recovery cache updated"
  | "Saving to server…"
  | "Synced to server"
  | "Server conflict detected";
type SectionKey =
  | "introduction"
  | "background"
  | "definitions"
  | "points"
  | "subpoints"
  | "examples"
  | "illustrations"
  | "applications"
  | "propheticInsights"
  | "altarCall"
  | "conclusion"
  | "prayers"
  | "declarations";

interface SermonSection {
  readonly key: SectionKey;
  readonly label: string;
  readonly minutes: number;
  content: string;
}
interface ReviewPanel {
  readonly title: string;
  readonly items: readonly string[];
}
interface AiJob {
  readonly label: string;
  readonly scope: "Section" | "Document";
  readonly progress: number;
  readonly preview: string;
  readonly diff: string;
}

const INITIAL_SECTIONS: readonly SermonSection[] = [
  {
    key: "introduction",
    label: "Introduction",
    minutes: 4,
    content:
      "Open with the promise of Christ's delegated authority and invite listeners to locate their confidence in Him.",
  },
  {
    key: "background",
    label: "Biblical background",
    minutes: 5,
    content:
      "Read Luke 10:19 alongside Ephesians 1:19-23 to frame authority as union with the risen Christ.",
  },
  {
    key: "definitions",
    label: "Definitions",
    minutes: 3,
    content:
      "Define spiritual authority as obedient representation, not domination or performance.",
  },
  {
    key: "points",
    label: "Points",
    minutes: 14,
    content:
      "Point 1: authority begins with identity. Point 2: authority grows through submission. Point 3: authority serves people in love.",
  },
  {
    key: "subpoints",
    label: "Subpoints",
    minutes: 5,
    content:
      "Add supporting scriptures, pastoral transitions, and concise summaries under each main point.",
  },
  {
    key: "examples",
    label: "Examples",
    minutes: 4,
    content:
      "Use a workplace and family example that shows humble confidence rather than fear.",
  },
  {
    key: "illustrations",
    label: "Illustrations",
    minutes: 4,
    content:
      "Illustrate with an ambassador carrying delegated authority from a kingdom.",
  },
  {
    key: "applications",
    label: "Applications",
    minutes: 5,
    content:
      "Call the church to pray, speak truth, forgive quickly, resist temptation, and serve boldly this week.",
  },
  {
    key: "propheticInsights",
    label: "Prophetic insights",
    minutes: 3,
    content:
      "Declare a season of renewed courage, disciplined prayer, and restored spiritual identity.",
  },
  {
    key: "altarCall",
    label: "Altar call",
    minutes: 3,
    content:
      "Invite salvation, rededication, and prayer for believers who have lived beneath their calling.",
  },
  {
    key: "conclusion",
    label: "Conclusion",
    minutes: 2,
    content:
      "Summarize the message: in Christ, authority is received, submitted, and exercised in love.",
  },
  {
    key: "prayers",
    label: "Prayers",
    minutes: 2,
    content: "Lead prayer for boldness, discernment, humility, and protection.",
  },
  {
    key: "declarations",
    label: "Declarations",
    minutes: 1,
    content:
      "I walk in Christ's authority with humility, love, courage, and obedience.",
  },
];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .toolbar,
      .actions,
      .status-row,
      .formatbar,
      .panel-tabs {
        display: flex;
        gap: 0.75rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .toolbar {
        justify-content: space-between;
      }
      .studio {
        grid-template-columns: 280px minmax(420px, 1fr) 320px;
      }
      .panel,
      .editor-shell {
        background: #fff;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 1rem;
      }
      .metadata {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .outline button,
      .panel-tabs button,
      .ai button {
        width: 100%;
        justify-content: flex-start;
      }
      .outline-list {
        display: grid;
        gap: 0.5rem;
      }
      .section-card {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 1rem;
        margin: 1rem 0;
        background: #fff;
      }
      .section-card:focus-within {
        box-shadow: 0 0 0 3px #dcd4f7;
      }
      .rich-editor {
        min-height: 86px;
        outline: 0;
        line-height: 1.7;
      }
      .formatbar {
        border-bottom: 1px solid var(--line);
        padding-bottom: 0.75rem;
      }
      .formatbar button[aria-pressed="true"] {
        background: #ede8fb;
        color: var(--violet);
      }
      .side-stack {
        display: grid;
        gap: 1rem;
      }
      .job {
        border: 1px dashed #cfc8e8;
        background: #fbfaff;
        border-radius: 12px;
        padding: 0.8rem;
      }
      .conflict {
        border-color: #f79009;
        background: #fffaeb;
      }
      .kbd {
        font-family: ui-monospace, monospace;
        border: 1px solid var(--line);
        border-radius: 6px;
        padding: 0.1rem 0.35rem;
        background: #f7f7fa;
      }
      .export-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.5rem;
      }
      @media (max-width: 1100px) {
        .studio {
          grid-template-columns: 1fr;
        }
        .outline {
          order: -1;
        }
        .metadata {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<header class="toolbar">
      <div>
        <p class="eyebrow">
          Sermon studio · {{ metadata.controls.status.value }}
        </p>
        <h1>{{ metadata.controls.title.value }}</h1>
        <p class="muted">
          {{ totalMinutes() }} planned minutes · {{ saveState() }}
        </p>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" (click)="recoverDraft()">
          Recover draft</button
        ><button
          class="btn secondary"
          type="button"
          (click)="simulateConflict()"
        >
          Check conflicts</button
        ><button
          class="btn"
          type="button"
          [disabled]="isBusy()"
          (click)="submitForReview()"
        >
          Submit for review
        </button>
      </div>
    </header>
    <form
      class="card grid metadata"
      [formGroup]="metadata"
      aria-label="Sermon metadata panel"
    >
      @for (field of metadataFields; track field.name) {
        <div class="field">
          <label [for]="field.name">{{ field.label }}</label>
          @if (field.kind === "select") {
            <select [id]="field.name" [formControlName]="field.name">
              @for (option of field.options; track option) {
                <option [value]="option">{{ option }}</option>
              }
            </select>
          } @else {
            <input
              [id]="field.name"
              [type]="field.kind"
              [formControlName]="field.name"
            />
          }
        </div>
      }
    </form>
    <div class="grid studio">
      <aside class="panel outline" aria-label="Sermon outline navigation">
        <h2>Outline</h2>
        <div class="outline-list">
          @for (section of sections(); track section.key) {
            <button
              class="btn secondary"
              type="button"
              (click)="focusSection(section.key)"
            >
              {{ section.label }}
              <span class="badge">{{ section.minutes }}m</span>
            </button>
          }
        </div>
      </aside>
      <main class="editor-shell">
        <div class="formatbar" role="toolbar" aria-label="Formatting controls">
          <button
            class="btn secondary"
            type="button"
            aria-pressed="false"
            (click)="format('bold')"
          >
            <b>B</b></button
          ><button
            class="btn secondary"
            type="button"
            (click)="format('italic')"
          >
            <i>I</i></button
          ><button
            class="btn secondary"
            type="button"
            (click)="format('formatBlock', 'H2')"
          >
            Heading</button
          ><button
            class="btn secondary"
            type="button"
            (click)="format('formatBlock', 'BLOCKQUOTE')"
          >
            Quote</button
          ><button
            class="btn secondary"
            type="button"
            (click)="insertScripture()"
          >
            Scripture</button
          ><span class="muted"
            ><span class="kbd">Ctrl</span>+<span class="kbd">S</span> save ·
            <span class="kbd">Alt</span>+<span class="kbd">1-9</span> focus
            panels</span
          >
        </div>
        @for (section of sections(); track section.key) {
          <section class="section-card" [id]="section.key">
            <h2>{{ section.label }}</h2>
            <div
              class="rich-editor"
              contenteditable="true"
              role="textbox"
              aria-multiline="true"
              [attr.aria-label]="section.label + ' sermon section'"
              [textContent]="section.content"
              (input)="updateSection(section.key, $event)"
            ></div>
            <div class="actions">
              <button
                class="btn secondary"
                type="button"
                (click)="runAi('Expand and strengthen', 'Section', section.key)"
              >
                ✦ Improve section</button
              ><button
                class="btn secondary"
                type="button"
                (click)="undo(section.key)"
              >
                Undo
              </button>
            </div>
          </section>
        }
      </main>
      <aside class="side-stack" aria-label="Sermon support panels">
        <article class="panel ai">
          <h2>AI assistant</h2>
          @for (action of aiActions; track action) {
            <button
              class="btn secondary"
              type="button"
              (click)="runAi(action, 'Document')"
            >
              ✦ {{ action }}
            </button>
          }
          @if (activeJob()) {
            <div class="job">
              <b>{{ activeJob()?.label }}</b>
              <p>{{ activeJob()?.scope }} job · {{ activeJob()?.progress }}%</p>
              <progress max="100" [value]="activeJob()?.progress"></progress>
              <p><b>Preview:</b> {{ activeJob()?.preview }}</p>
              <p><b>Diff:</b> {{ activeJob()?.diff }}</p>
            </div>
          }
        </article>
        @for (panel of panels; track panel.title) {
          <article class="panel">
            <h2>{{ panel.title }}</h2>
            <div class="chips">
              @for (item of panel.items; track item) {
                <span class="badge info">{{ item }}</span>
              }
            </div>
          </article>
        }
        <article class="panel">
          <h2>Export</h2>
          <div class="export-grid">
            @for (format of exportFormats; track format) {
              <button
                class="btn secondary"
                type="button"
                [disabled]="isBusy()"
                (click)="exportSermon(format)"
              >
                {{ format }}
              </button>
            }
          </div>
          <p class="muted">
            Exports preserve outline blocks and scripture metadata.
          </p>
        </article>
      </aside>
    </div>`,
})
export class SermonPage implements OnInit, OnDestroy {
  private readonly sermons = inject(SermonService);
  private readonly approvals = inject(ApprovalService);
  private readonly platform = inject(PlatformStateService);
  readonly durationTargets: readonly SermonDuration[] = [15, 30, 45, 60, 90];
  readonly metadata = new FormGroup({
    title: new FormControl("Untitled sermon", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    series: new FormControl("Kingdom Living", { nonNullable: true }),
    serviceDate: new FormControl("2026-08-09", { nonNullable: true }),
    speaker: new FormControl("Senior Pastor", { nonNullable: true }),
    scriptures: new FormControl("Luke 10:19; Ephesians 1:19-23", {
      nonNullable: true,
    }),
    translation: new FormControl("NKJV", { nonNullable: true }),
    audience: new FormControl("Sunday service", { nonNullable: true }),
    duration: new FormControl<SermonDuration>(45, { nonNullable: true }),
    tone: new FormControl("Pastoral and prophetic", { nonNullable: true }),
    status: new FormControl<SermonStatus>("Draft", { nonNullable: true }),
  });
  readonly metadataFields = [
    "title",
    "series",
    "serviceDate",
    "speaker",
    "scriptures",
    "translation",
    "audience",
    "duration",
    "tone",
    "status",
  ].map((name) => ({
    name,
    label: name
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase()),
    kind:
      name === "serviceDate"
        ? "date"
        : name === "duration" || name === "status"
          ? "select"
          : "text",
    options:
      name === "duration"
        ? this.durationTargets
        : ["Draft", "Awaiting Approval", "Approved", "Published"],
  }));
  readonly sections = signal(
    INITIAL_SECTIONS.map((section) => ({ ...section })),
  );
  readonly saveState = signal<SaveState>("Recovered draft");
  readonly isBusy = signal(false);
  readonly activeJob = signal<AiJob | undefined>(undefined);
  readonly panels: readonly ReviewPanel[] = [
    {
      title: "Scriptures",
      items: ["Luke 10:19", "Ephesians 1:19-23", "Mark 16:17"],
    },
    {
      title: "Version history",
      items: ["v3 current", "v2 AI refinement", "v1 recovered draft"],
    },
    {
      title: "Comments",
      items: ["Reviewer: clarify point two", "Pastor: keep altar call"],
    },
    {
      title: "Approval status",
      items: ["Draft", "Review required", "Approved sections lock"],
    },
  ];
  readonly aiActions = [
    "Create introduction",
    "Add scriptures",
    "Simplify document",
    "Expand sermon",
    "Create altar call",
    "Generate prayers",
    "Prepare declarations",
  ];
  readonly exportFormats = ["DOCX", "PDF", "HTML", "Markdown"];
  private timer?: ReturnType<typeof setTimeout>;
  private history = new Map<SectionKey, string[]>();
  private sermonId?: EntityId;
  private revision?: number;
  private contentVersionId?: string;
  readonly totalMinutes = computed(() =>
    this.sections().reduce((sum, section) => sum + section.minutes, 0),
  );
  ngOnInit(): void {
    window.addEventListener("keydown", this.handleShortcut);
  }
  ngOnDestroy(): void {
    clearTimeout(this.timer);
    window.removeEventListener("keydown", this.handleShortcut);
  }
  updateSection(key: SectionKey, event: Event): void {
    const value = (event.target as HTMLElement).innerText;
    this.history.set(key, [
      ...(this.history.get(key) ?? []),
      this.sections().find((s) => s.key === key)?.content ?? "",
    ]);
    this.sections.update((items) =>
      items.map((item) =>
        item.key === key ? { ...item, content: value } : item,
      ),
    );
    this.queueSave();
  }
  focusSection(key: SectionKey): void {
    document
      .getElementById(key)
      ?.querySelector<HTMLElement>("[contenteditable]")
      ?.focus();
  }
  format(command: string, value?: string): void {
    document.execCommand(command, false, value);
    this.queueSave();
  }
  insertScripture(): void {
    document.execCommand("insertText", false, "\nScripture: ");
    this.queueSave();
  }
  undo(key: SectionKey): void {
    const previous = this.history.get(key)?.pop();
    if (!previous) return;
    this.sections.update((items) =>
      items.map((item) =>
        item.key === key ? { ...item, content: previous } : item,
      ),
    );
    this.queueSave();
  }
  runAi(label: string, scope: "Section" | "Document", key?: SectionKey): void {
    this.activeJob.set({
      label,
      scope,
      progress: 35,
      preview: key
        ? `Suggested refinement for ${key}.`
        : "Document-level refinement preview is ready for review.",
      diff: "+ Adds pastoral clarity and scripture metadata before applying.",
    });
    this.ensureServerDraft(() => {
      if (!this.sermonId) return;
      this.sermons
        .runAi(this.sermonId, { label, scope, sectionKey: key })
        .subscribe({
          next: (job) =>
            this.activeJob.set({
              label: job.label ?? label,
              scope,
              progress: job.progress,
              preview: job.preview ?? "AI refinement queued on the server.",
              diff: job.diff ?? "+ Server job will return candidate changes.",
            }),
          error: () => this.finishLocalAiPreview(),
        });
    });
  }
  recoverDraft(): void {
    void this.restoreLocalDraft();
  }
  simulateConflict(): void {
    if (!this.sermonId) {
      this.platform.notify({
        tone: "info",
        title: "No server draft yet",
        message: "Save the sermon before checking server conflicts.",
      });
      return;
    }
    this.isBusy.set(true);
    this.sermons.checkConflicts(this.sermonId, this.revision).subscribe({
      next: (record) => {
        this.applyServerRecord(record);
        this.saveState.set("Synced to server");
        this.platform.notify({
          tone: "success",
          title: "No conflicts found",
          message: "The sermon matches the latest server revision.",
        });
      },
      error: () => {
        this.saveState.set("Server conflict detected");
        this.platform.notify({
          tone: "warning",
          title: "Conflict check failed",
          message: "The server could not verify the current sermon revision.",
        });
      },
      complete: () => this.isBusy.set(false),
    });
  }
  submitForReview(): void {
    this.ensureServerDraft(() => {
      if (!this.sermonId) return;
      this.isBusy.set(true);
      if (!this.contentVersionId) {
        this.isBusy.set(false);
        this.platform.notify({
          tone: "error",
          title: "Version required",
          message: "Save the sermon version before submitting it for review.",
        });
        return;
      }
      this.approvals
        .submitForReview({
          contentId: this.sermonId,
          contentVersionId: this.contentVersionId,
          contentType: "sermon",
          priority: "normal",
        })
        .subscribe({
          next: () => {
            this.metadata.controls.status.setValue("Awaiting Approval");
            this.platform.notify({
              tone: "success",
              title: "Submitted for review",
              message: "The sermon is now awaiting approval.",
            });
          },
          error: () =>
            this.platform.notify({
              tone: "error",
              title: "Submit failed",
              message: "The sermon could not be submitted for review.",
            }),
          complete: () => this.isBusy.set(false),
        });
    });
  }
  exportSermon(format: string): void {
    this.ensureServerDraft(() => {
      if (!this.sermonId) return;
      this.isBusy.set(true);
      this.sermons.requestExport(this.sermonId, format).subscribe({
        next: (job) =>
          this.platform.notify({
            tone: "success",
            title: `${format} export queued`,
            message: `Export job ${job.id} is ${job.status} (${job.progress}%).`,
          }),
        error: () =>
          this.platform.notify({
            tone: "error",
            title: "Export failed",
            message: `${format} export could not be queued.`,
          }),
        complete: () => this.isBusy.set(false),
      });
    });
  }
  private queueSave(): void {
    this.saveState.set("Unsaved changes");
    clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.persist(), 450);
  }
  private async persist(): Promise<void> {
    this.saveState.set("Saving to server…");
    const body = this.draftRequest();
    const request = this.sermonId
      ? this.sermons.saveDraft(this.sermonId, body)
      : this.sermons.createDraft(body);
    request.subscribe({
      next: (record) => {
        this.applyServerRecord(record);
        this.saveState.set("Synced to server");
      },
      error: () => void this.persistLocally(),
    });
  }
  private async persistLocally(): Promise<void> {
    this.saveState.set("Saving locally…");
    const db = await this.draftDb();
    await db.put(
      "sermons",
      { ...this.draftRequest(), savedAt: new Date().toISOString() },
      "current",
    );
    this.saveState.set("Recovery cache updated");
  }
  private async restoreLocalDraft(): Promise<void> {
    const db = await this.draftDb();
    const draft = (await db.get("sermons", "current")) as
      (SermonDraftRequest & { savedAt: string }) | undefined;
    if (draft) {
      this.metadata.patchValue(draft.metadata);
      this.sections.set(
        draft.sections.map((section) => ({
          ...section,
          key: section.key as SectionKey,
        })),
      );
    }
    this.saveState.set("Recovered draft");
  }
  private draftDb() {
    return openDB("sanctuary-drafts", 1, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("sermons"))
          database.createObjectStore("sermons");
      },
    });
  }
  private ensureServerDraft(afterSave: () => void): void {
    if (this.sermonId) {
      afterSave();
      return;
    }
    this.isBusy.set(true);
    this.sermons.createDraft(this.draftRequest()).subscribe({
      next: (record) => {
        this.applyServerRecord(record);
        afterSave();
      },
      error: () => {
        this.platform.notify({
          tone: "error",
          title: "Save required",
          message: "The sermon must be saved to the server before this action.",
        });
      },
      complete: () => this.isBusy.set(false),
    });
  }
  private draftRequest(): SermonDraftRequest {
    return {
      metadata: this.metadata.getRawValue(),
      sections: this.sections(),
      revision: this.revision,
    };
  }
  private applyServerRecord(
    record: Pick<SermonRecord, "id" | "revision" | "currentVersionId">,
  ): void {
    this.sermonId = record.id;
    this.revision = record.revision;
    this.contentVersionId = record.currentVersionId;
  }
  private finishLocalAiPreview(): void {
    setTimeout(
      () =>
        this.activeJob.update((job) => (job ? { ...job, progress: 100 } : job)),
      700,
    );
  }
  private readonly handleShortcut = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
      event.preventDefault();
      this.queueSave();
    }
    if (event.altKey && /^[1-9]$/.test(event.key)) {
      event.preventDefault();
      document
        .querySelectorAll<HTMLElement>("aside, main")
        [Number(event.key) - 1]?.focus();
    }
  };
}
