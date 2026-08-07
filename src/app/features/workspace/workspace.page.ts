import { TitleCasePipe } from "@angular/common";
import { finalize, switchMap, type Subscription } from "rxjs";
import {
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { AsyncJob, EntityId } from "../../models/domain.models";
import { AiJobService, isTerminalJob } from "../../core/ai/ai-job.service";
import { WorkflowService } from "./workflow.service";
import { ApprovalService } from "../reviews/approval.service";
import type {
  ReviewContentType,
  ReviewQueueItem,
} from "../reviews/reviews.models";

interface FeaturePanel {
  readonly title: string;
  readonly items: readonly string[];
}
interface FeatureConfig {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly primaryAction: string;
  readonly fields: readonly string[];
  readonly panels: readonly FeaturePanel[];
  readonly statuses: readonly string[];
}

const FEATURE_CONFIGS: Readonly<Record<string, FeatureConfig>> = {
  themes: {
    eyebrow: "Theme generator",
    title: "Theme generation workspace",
    description:
      "Capture pastoral direction, generate alternatives asynchronously, compare versions, and submit scripture-centered themes for approval.",
    primaryAction: "Generate theme",
    fields: [
      "Month and year",
      "Topic",
      "Main scripture",
      "Supporting scriptures",
      "Spiritual emphasis",
      "Pastor notes",
      "Previous theme",
      "Upcoming events",
      "Tone",
      "Intended audience",
    ],
    statuses: [
      "Draft",
      "Generating",
      "Version ready",
      "Awaiting Approval",
      "Approved",
    ],
    panels: [
      {
        title: "Generated output",
        items: [
          "Theme title and subtitle",
          "Pastoral introduction",
          "Objectives",
          "Weekly teaching direction",
          "Monthly confession",
          "Prophetic declaration",
          "Hashtags",
          "Flyer headline",
          "Design concept",
        ],
      },
      {
        title: "AI refinement actions",
        items: [
          "Make more prophetic",
          "Make more pastoral",
          "Simplify",
          "Add scriptures",
          "Shorten",
          "Expand",
          "Create alternatives",
          "Save as template",
        ],
      },
    ],
  },
  "prayer-points": {
    eyebrow: "Prayer module",
    title: "Prayer collection builder",
    description:
      "Generate, edit, reorder, and preview prayer collections with scripture, declarations, and congregational responses.",
    primaryAction: "Generate prayer points",
    fields: [
      "Quantity",
      "Theme",
      "Scripture",
      "Prayer category",
      "Tone",
      "Congregational response",
      "Include scripture text",
      "Include declaration",
    ],
    statuses: [
      "Draft",
      "Reordering",
      "Card preview",
      "Awaiting Approval",
      "Approved",
    ],
    panels: [
      {
        title: "Prayer categories",
        items: [
          "Thanksgiving",
          "Repentance",
          "Protection",
          "Healing",
          "Deliverance",
          "Family",
          "Marriage",
          "Children",
          "Career",
          "Business",
          "Finance",
          "Ministry",
          "Evangelism",
          "Revival",
          "Spiritual warfare",
          "National prayer",
          "Direction",
          "Enlargement",
          "Divine supply",
        ],
      },
      {
        title: "Each prayer point",
        items: [
          "Sequence",
          "Title",
          "Prayer text",
          "Scripture reference",
          "Scripture quotation",
          "Prophetic response",
          "Congregational response",
        ],
      },
    ],
  },
  declarations: {
    eyebrow: "Declaration module",
    title: "Prophetic declaration studio",
    description:
      "Prepare first-person, congregational, flyer, social, and video voice-over declaration versions for ministry use.",
    primaryAction: "Generate declaration",
    fields: [
      "Declaration type",
      "Scripture foundation",
      "Tone",
      "Audience",
      "Service context",
      "Monthly campaign",
    ],
    statuses: ["Draft", "Version ready", "Awaiting Approval", "Approved"],
    panels: [
      {
        title: "Declaration types",
        items: [
          "Daily",
          "Weekly",
          "Monthly",
          "Service-opening",
          "Communion",
          "Offering",
          "Family",
          "Business",
          "Healing",
          "New-month",
        ],
      },
      {
        title: "Required versions",
        items: [
          "Title",
          "Scripture foundation",
          "First-person declaration",
          "Congregational version",
          "Short social version",
          "Flyer version",
          "Video voice-over version",
        ],
      },
    ],
  },
  videos: {
    eyebrow: "Video studio",
    title: "Short-form video workflow",
    description:
      "Compose vertical ministry videos with scenes, overlays, captions, audio, voice-over, timing, transitions, preview, and backend render status.",
    primaryAction: "Create video project",
    fields: [
      "Video type",
      "Duration",
      "Campaign",
      "Scene brief",
      "Voice-over notes",
      "Caption style",
      "Background audio",
    ],
    statuses: [
      "Draft",
      "Preview ready",
      "Rendering",
      "Render complete",
      "Awaiting Approval",
    ],
    panels: [
      {
        title: "Project controls",
        items: [
          "Vertical 9:16 canvas",
          "Scene list",
          "Text overlays",
          "Image assets",
          "Background audio",
          "Voice-over",
          "Captions",
          "Timing controls",
          "Transitions",
        ],
      },
      {
        title: "Video types",
        items: [
          "Animated flyer",
          "Scripture video",
          "Prayer video",
          "Sermon quote",
          "Event invitation",
          "Countdown",
          "Prophetic declaration",
          "Sermon recap",
        ],
      },
    ],
  },
  calendar: {
    eyebrow: "Content calendar",
    title: "Ministry publishing calendar",
    description:
      "Plan month, week, day, and agenda views with campaign grouping, drag-and-drop rescheduling, owner filters, approval state, and publishing state.",
    primaryAction: "Schedule content",
    fields: [
      "View",
      "Campaign",
      "Ministry",
      "Platform",
      "Owner",
      "Approval state",
      "Publishing state",
    ],
    statuses: [
      "Draft",
      "Awaiting Approval",
      "Approved",
      "Scheduled",
      "Published",
      "Failed",
    ],
    panels: [
      { title: "Calendar views", items: ["Month", "Week", "Day", "Agenda"] },
      {
        title: "Indicators",
        items: [
          "Facebook",
          "Instagram",
          "TikTok",
          "Campaign",
          "Ministry",
          "Assigned owner",
          "Approval",
          "Publishing",
        ],
      },
    ],
  },
  media: {
    eyebrow: "Media library",
    title: "Searchable ministry asset library",
    description:
      "Manage logos, photos, backgrounds, generated assets, documents, audio, and video with tags, folders, upload progress, and usage references.",
    primaryAction: "Upload assets",
    fields: [
      "Search",
      "Folder",
      "Tags",
      "File type",
      "Usage reference",
      "Archive status",
    ],
    statuses: ["Ready", "Uploading", "Processing", "Archived"],
    panels: [
      {
        title: "Asset types",
        items: [
          "Logos",
          "Pastor photos",
          "Guest photos",
          "Backgrounds",
          "Flyer designs",
          "Videos",
          "Audio",
          "Documents",
          "Generated assets",
        ],
      },
      {
        title: "Operations",
        items: [
          "Grid/list view",
          "Bulk upload",
          "Rename",
          "Delete",
          "Archive",
          "Image dimensions",
          "File size",
          "Upload progress",
        ],
      },
    ],
  },
  analytics: {
    eyebrow: "Analytics",
    title: "Ministry content analytics",
    description:
      "Review generation, approval, publishing, engagement, reach, follower growth, AI usage, and top-performing campaigns with loading, empty, and error states.",
    primaryAction: "Refresh analytics",
    fields: ["Date range", "Platform", "Campaign", "Metric group"],
    statuses: ["Loading", "Current", "Empty", "Error"],
    panels: [
      {
        title: "Metrics",
        items: [
          "Content generated",
          "Content approved",
          "Posts published",
          "Failures",
          "Reach",
          "Views",
          "Likes",
          "Comments",
          "Shares",
          "Saves",
          "Clicks",
          "Follower growth",
          "AI usage",
        ],
      },
      {
        title: "Top content",
        items: ["Top campaigns", "Top sermons", "Top posts"],
      },
    ],
  },
  team: {
    eyebrow: "Team management",
    title: "Team, roles, and permissions",
    description:
      "Invite ministry teammates, assign roles, grant granular permissions, and review membership status without relying on roles alone.",
    primaryAction: "Invite teammate",
    fields: ["Name", "Email", "Role", "Permissions", "Invitation message"],
    statuses: ["Invited", "Active", "Suspended"],
    panels: [
      {
        title: "Roles",
        items: [
          "ChurchAdministrator",
          "SeniorPastor",
          "AssociatePastor",
          "ContentWriter",
          "MediaTeam",
          "Reviewer",
          "Publisher",
          "Viewer",
        ],
      },
      {
        title: "Permissions",
        items: [
          "themes.create",
          "themes.approve",
          "sermons.publish",
          "flyers.edit",
          "social.schedule",
          "social.publish",
          "users.manage",
          "settings.manage",
        ],
      },
    ],
  },

  "social-accounts": {
    eyebrow: "Social connections",
    title: "Connected social accounts",
    description:
      "Inspect Facebook Pages, Instagram Professional Accounts, and TikTok account capabilities without exposing OAuth tokens in the browser.",
    primaryAction: "Connect account",
    fields: [
      "Platform",
      "Account identifier",
      "Permission scope",
      "Reconnect reason",
    ],
    statuses: ["Connected", "Expiring", "Needs Reconnect", "Disconnected"],
    panels: [
      {
        title: "Connection details",
        items: [
          "Connected account",
          "Account identifier",
          "Token status",
          "Permissions",
          "Last synchronization",
          "Publishing capabilities",
          "Expiration warning",
        ],
      },
      {
        title: "Actions",
        items: [
          "Reconnect",
          "Disconnect",
          "Refresh capabilities",
          "Open publisher",
        ],
      },
    ],
  },
  notifications: {
    eyebrow: "Notifications",
    title: "Ministry notification center",
    description:
      "Monitor review requests, approval decisions, publishing failures, mentions, assignments, and expiring social connections.",
    primaryAction: "Mark reviewed",
    fields: ["Notification type", "Priority", "Owner", "Status"],
    statuses: ["Unread", "Read", "Action Required", "Archived"],
    panels: [
      {
        title: "Notification types",
        items: [
          "Review request",
          "Approval decision",
          "Publishing failure",
          "Mention",
          "Assignment",
          "Token expiration",
          "Subscription alert",
        ],
      },
    ],
  },
  subscription: {
    eyebrow: "Subscription",
    title: "Plan and billing readiness",
    description:
      "Show plan status, renewal timing, usage limits, grace states, and upgrade paths while keeping payment flows delegated to secure backend checkout.",
    primaryAction: "Review plan",
    fields: ["Plan", "Status", "Renewal date", "Usage period"],
    statuses: ["Trial", "Active", "Grace", "Past Due", "Cancelled"],
    panels: [
      {
        title: "Usage",
        items: [
          "AI generations",
          "Team seats",
          "Storage",
          "Scheduled posts",
          "Connected accounts",
        ],
      },
    ],
  },
  "audit-logs": {
    eyebrow: "Audit logs",
    title: "Workspace audit history",
    description:
      "Trace content, approval, publishing, account, and settings events with correlation IDs for support and compliance reviews.",
    primaryAction: "Filter audit log",
    fields: ["Actor", "Action", "Entity", "Date range", "Correlation ID"],
    statuses: ["Loaded", "Filtered", "Exporting", "Error"],
    panels: [
      {
        title: "Tracked events",
        items: [
          "Generated",
          "Edited",
          "Submitted",
          "Approved",
          "Rejected",
          "Scheduled",
          "Published",
          "Failed",
          "Settings changed",
          "User invited",
        ],
      },
    ],
  },
  settings: {
    eyebrow: "Church settings",
    title: "Church profile and brand settings",
    description:
      "Maintain identity, service times, doctrinal guidelines, ministry tone, default footer, hashtags, and connected social profile references.",
    primaryAction: "Save settings",
    fields: [
      "Church name",
      "Slogan",
      "Description",
      "Senior pastor",
      "Logos",
      "Brand colors",
      "Fonts",
      "Address",
      "Service days",
      "Service times",
      "Bible translation",
      "Statement of faith",
      "Prohibited content",
    ],
    statuses: ["Draft", "Validated", "Saved"],
    panels: [
      {
        title: "Identity",
        items: [
          "Logo",
          "Secondary logo",
          "Colors",
          "Fonts",
          "Digital address",
          "Website",
          "Facebook",
          "Instagram",
          "TikTok",
          "YouTube",
        ],
      },
      {
        title: "Ministry guardrails",
        items: [
          "Preferred Bible translation",
          "Ministry tone",
          "Statement of faith",
          "Doctrinal guidelines",
          "Prohibited content",
          "Standard hashtags",
        ],
      },
    ],
  },
};

const DEFAULT_CONFIG: FeatureConfig = {
  eyebrow: "Ministry workspace",
  title: "Content operations workspace",
  description:
    "Create, review, approve, schedule, and monitor ministry content with resilient drafts and clear workflow states.",
  primaryAction: "Create content",
  fields: [
    "Title",
    "Campaign",
    "Owner",
    "Due date",
    "Approval status",
    "Publishing status",
  ],
  statuses: [
    "Draft",
    "Awaiting Approval",
    "Approved",
    "Scheduled",
    "Published",
  ],
  panels: [
    {
      title: "Workflow",
      items: [
        "Draft",
        "Review",
        "Approval",
        "Scheduling",
        "Publishing",
        "Audit history",
      ],
    },
  ],
};

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, TitleCasePipe],
  styles: [
    `
      .head,
      .toolbar,
      .record {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .head {
        align-items: end;
      }
      .layout {
        grid-template-columns: minmax(280px, 380px) 1fr;
      }
      .panels {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
      .form {
        display: grid;
        gap: 0.9rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .record {
        padding: 0.85rem 0;
        border-bottom: 1px solid var(--line);
      }
      .record:last-child {
        border-bottom: 0;
      }
      .status-flow {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .status-flow span {
        position: relative;
      }
      .preview {
        min-height: 170px;
        border: 1px dashed #cfc8e8;
        border-radius: 14px;
        padding: 1rem;
        background: #fbfaff;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      @media (max-width: 900px) {
        .layout,
        .panels {
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
        <p class="eyebrow">{{ config().eyebrow }}</p>
        <h1>{{ config().title }}</h1>
        <p class="muted">{{ config().description }}</p>
      </div>
      <div class="actions">
        <button class="btn secondary" type="button" (click)="saveDraft()">
          Save draft</button
        ><button
          class="btn"
          type="button"
          [disabled]="busy()"
          (click)="runPrimary()"
        >
          {{ busy() ? "Queueing…" : "✦ " + config().primaryAction }}
        </button>
        @if (canSubmitForReview()) {
          <button
            class="btn"
            type="button"
            [disabled]="submitting()"
            (click)="submitForReview()"
          >
            {{ submitting() ? "Submitting…" : "Submit for review" }}
          </button>
        }
        @if (currentJobId() && cancellationSupported()) {
          <button class="btn secondary" type="button" (click)="cancelJob()">
            Cancel AI job
          </button>
        }
      </div>
    </header>
    <section class="toolbar card" aria-label="Workflow status">
      <div>
        <b>Workflow</b>
        <p class="muted">
          Async work is tracked explicitly; approved items can be locked before
          scheduling.
        </p>
      </div>
      @if (submissionError()) {
        <p class="error" role="alert">{{ submissionError() }}</p>
      }
      <div class="status-flow">
        @for (status of config().statuses; track status) {
          <span class="badge" [class.info]="status === activeStatus()">{{
            status
          }}</span>
        }
      </div>
    </section>
    <div class="grid layout">
      <form class="card form" [formGroup]="form" aria-label="Workspace brief">
        <h2>Brief</h2>
        @for (field of config().fields; track field) {
          <div class="field">
            <label [for]="controlId(field)">{{ field }}</label
            ><input
              [id]="controlId(field)"
              [formControlName]="controlName(field)"
              [placeholder]="field"
            /><small class="error" aria-live="polite">
              @if (
                form.controls[controlName(field)].invalid &&
                form.controls[controlName(field)].touched
              ) {
                {{ field }} is required.
              }
            </small>
          </div>
        }
      </form>
      <section class="grid">
        <article class="card">
          <h2>{{ busy() ? "Active work queue" : "Recent work" }}</h2>
          @for (record of records(); track record.title) {
            <div class="record">
              <span
                ><b>{{ record.title }}</b
                ><br /><small class="muted"
                  >{{ record.owner }} · {{ record.updated }}</small
                ></span
              ><span class="badge warning">{{ record.status }}</span>
            </div>
          } @empty {
            <div class="empty">
              <h3>No {{ config().title | titlecase }} yet</h3>
              <p>
                Use the brief to create the first item. Draft recovery keeps
                interrupted work safe.
              </p>
            </div>
          }
        </article>
        <div class="grid panels">
          @for (panel of config().panels; track panel.title) {
            <article class="card">
              <h2>{{ panel.title }}</h2>
              <div class="chips">
                @for (item of panel.items; track item) {
                  <span class="badge secondary">{{ item }}</span>
                }
              </div>
            </article>
          }
        </div>
        <article class="card">
          <h2>Preview and review</h2>
          <div class="preview">
            <b>{{ previewTitle() }}</b>
            <p class="muted">
              Version history, reviewer comments, approval controls, audit
              history, empty/error states, and mobile-friendly cards are part of
              this workspace pattern.
            </p>
          </div>
        </article>
      </section>
    </div>`,
})
export class WorkspacePage {
  private readonly workflows = inject(WorkflowService);
  private readonly aiJobs = inject(AiJobService);
  private readonly approvals = inject(ApprovalService);
  private draftId?: EntityId;
  private draftRevision?: number;
  private contentVersionId?: string;
  private activeRun?: Subscription;
  readonly kind = input("content");
  readonly activeStatus = signal("Draft");
  readonly busy = signal(false);
  readonly submitting = signal(false);
  readonly approval = signal<ReviewQueueItem | null>(null);
  readonly submissionError = signal<string | null>(null);
  readonly currentJobId = signal<EntityId | undefined>(undefined);
  readonly cancellationSupported = signal(false);
  readonly records = signal<
    readonly { title: string; owner: string; updated: string; status: string }[]
  >([]);
  readonly config = computed(
    () => FEATURE_CONFIGS[this.kind()] ?? DEFAULT_CONFIG,
  );
  readonly form = new FormGroup<Record<string, FormControl<string>>>({});
  constructor() {
    effect(() => {
      this.config();
      this.rebuildForm();
    });
  }
  readonly previewTitle = computed(() => `${this.config().title} preview`);
  readonly canSubmitForReview = computed(
    () =>
      !!this.draftId &&
      !!this.contentVersionId &&
      !this.submitting() &&
      !["pending", "in_review", "changes_requested", "approved"].includes(
        this.approval()?.status ?? "",
      ),
  );
  controlName(label: string): string {
    return label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  }
  controlId(label: string): string {
    return `field-${this.kind()}-${this.controlName(label)}`;
  }
  rebuildForm(): void {
    for (const field of this.config().fields) {
      const name = this.controlName(field);
      if (!this.form.controls[name])
        this.form.addControl(
          name,
          new FormControl("", {
            nonNullable: true,
            validators: field.includes("Optional") ? [] : [Validators.required],
          }),
        );
    }
  }
  saveDraft(): void {
    this.rebuildForm();
    this.activeStatus.set("Draft");
    this.records.update((items) => [
      {
        title: `Draft ${this.config().title}`,
        owner: "Current user",
        updated: "Saved locally",
        status: "Draft",
      },
      ...items,
    ]);
  }
  runPrimary(): void {
    this.rebuildForm();
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const title =
      this.form.controls[this.controlName(this.config().fields[0])]?.value ||
      this.config().title;

    this.busy.set(true);
    this.activeRun = this.workflows
      .createDraft(this.kind(), this.brief())
      .pipe(
        switchMap((draft) => {
          this.draftId = draft.id;
          this.draftRevision = draft.revision;
          this.contentVersionId = draft.currentVersionId;
          return this.workflows.generate(
            this.kind(),
            this.draftId,
            this.draftRevision,
          );
        }),
        switchMap((job) => {
          this.currentJobId.set(job.id);
          this.cancellationSupported.set(job.cancellationSupported === true);
          return this.aiJobs.watch(job);
        }),
        finalize(() => {
          this.busy.set(false);
          this.currentJobId.set(undefined);
          this.cancellationSupported.set(false);
          this.activeRun = undefined;
        }),
      )
      .subscribe({
        next: (job) => this.applyJob(job, title),
        error: () => {
          this.activeStatus.set("Draft");
          this.records.update((items) => [
            {
              title,
              owner: "Backend API",
              updated: "Request failed",
              status: "Failed",
            },
            ...items,
          ]);
        },
      });
  }

  submitForReview(): void {
    const contentId = this.draftId;
    const contentVersionId = this.contentVersionId;
    const contentType = approvalContentType(this.kind());
    if (!contentId || !contentVersionId || !contentType || this.submitting())
      return;
    this.submitting.set(true);
    this.submissionError.set(null);
    this.approvals
      .submitForReview({
        contentId,
        contentVersionId,
        contentType,
        priority: "normal",
      })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (approval) => {
          this.approval.set(approval);
          this.activeStatus.set(statusLabel(approval.status));
        },
        error: (error: { error?: { message?: string } }) =>
          this.submissionError.set(
            error.error?.message ?? "Unable to submit content for review.",
          ),
      });
  }

  cancelJob(): void {
    const id = this.currentJobId();
    if (!id) return;
    this.aiJobs.cancel(id).subscribe({
      next: (job) => {
        this.applyJob(job);
        if (isTerminalJob(job)) this.activeRun?.unsubscribe();
      },
      error: () => this.activeStatus.set("Cancellation failed"),
    });
  }

  private applyJob(job: AsyncJob, title = this.config().title): void {
    const status =
      job.status === "completed"
        ? (this.config().statuses[2] ?? "Complete")
        : job.status === "failed" || job.status === "cancelled"
          ? job.status[0].toUpperCase() + job.status.slice(1)
          : (this.config().statuses[1] ?? "Running");
    this.activeStatus.set(status);
    this.cancellationSupported.set(
      !isTerminalJob(job) && job.cancellationSupported === true,
    );
    this.records.set([
      {
        title,
        owner: "Backend AI workflow",
        updated: job.message ?? `${job.status} · ${job.progress}%`,
        status,
      },
    ]);
  }

  private brief(): Record<string, string> {
    return Object.fromEntries(
      this.config().fields.map((field) => [
        this.controlName(field),
        this.form.controls[this.controlName(field)]?.value ?? "",
      ]),
    );
  }
}

function approvalContentType(kind: string): ReviewContentType | null {
  return (
    (
      {
        themes: "theme",
        "prayer-points": "prayer",
        declarations: "declaration",
      } as const
    )[kind as "themes" | "prayer-points" | "declarations"] ?? null
  );
}

function statusLabel(status: ReviewQueueItem["status"]): string {
  return status === "pending"
    ? "Awaiting Approval"
    : status === "in_review"
      ? "In Review"
      : status === "changes_requested"
        ? "Changes Requested"
        : status[0].toUpperCase() + status.slice(1);
}
