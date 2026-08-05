import { Component, computed, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

type SocialPlatform = "Facebook" | "Instagram" | "TikTok";
type PublishingState =
  | "Draft"
  | "Awaiting Approval"
  | "Approved"
  | "Scheduled"
  | "Publishing"
  | "Published"
  | "Failed"
  | "Cancelled"
  | "Manually Published";

interface ConnectedAccount {
  readonly platform: SocialPlatform;
  readonly identity: string;
  readonly tokenHealth: "Healthy" | "Warning" | "Expired";
  readonly permissions: readonly string[];
  readonly lastSync: string;
  readonly capabilities: readonly string[];
  readonly expires: string;
  readonly state: "Connected" | "Needs reconnect" | "Disconnected";
  readonly providerError?: string;
}

interface AuditEntry {
  readonly at: string;
  readonly actor: string;
  readonly action: string;
  readonly correlationId: string;
}

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .workspace {
        grid-template-columns: minmax(320px, 420px) 1fr;
      }
      .accounts,
      .previews,
      .state-grid,
      .audit {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
      .toolbar,
      .actions,
      .chips {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        align-items: center;
      }
      .account,
      .preview,
      .state,
      .audit-item {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 1rem;
      }
      .preview-media {
        display: grid;
        place-items: center;
        min-height: 190px;
        background: #24154d;
        color: white;
        border-radius: 12px;
        text-align: center;
        padding: 1rem;
      }
      .phone .preview-media {
        aspect-ratio: 9/16;
      }
      .invalid {
        border-color: var(--danger);
        background: #fff8f7;
      }
      .audit-item {
        background: #fafafa;
      }
      @media (max-width: 1050px) {
        .accounts,
        .previews,
        .state-grid,
        .audit {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 760px) {
        .workspace,
        .accounts,
        .previews,
        .state-grid,
        .audit {
          grid-template-columns: 1fr;
        }
        .actions {
          justify-content: stretch;
        }
        .actions .btn {
          flex: 1;
        }
      }
    `,
  ],
  template: `
    <p class="eyebrow">Social accounts and publisher</p>
    <h1>Connect accounts, approve, schedule, and publish safely</h1>
    <p class="muted">
      OAuth connections are handed off to the backend. Token values are never
      stored or displayed in the browser.
    </p>

    <section class="card grid" aria-labelledby="accounts-title">
      <div class="toolbar">
        <h2 id="accounts-title">Connected social accounts</h2>
        <button class="btn" type="button" (click)="connect('Facebook')">
          Connect Facebook Page</button
        ><button
          class="btn secondary"
          type="button"
          (click)="connect('Instagram')"
        >
          Connect Instagram Professional</button
        ><button
          class="btn secondary"
          type="button"
          (click)="connect('TikTok')"
        >
          Connect TikTok
        </button>
      </div>
      <div class="grid accounts">
        @for (account of accounts(); track account.platform) {
          <article
            class="account"
            [class.invalid]="account.tokenHealth !== 'Healthy'"
          >
            <span
              class="badge"
              [class.warning]="account.tokenHealth === 'Warning'"
              [class.danger]="account.tokenHealth === 'Expired'"
              >{{ account.platform }} · {{ account.state }}</span
            >
            <h3>{{ account.identity }}</h3>
            <p>
              <b>Token health:</b> {{ account.tokenHealth }} · expires
              {{ account.expires }}
            </p>
            <p><b>Permissions:</b> {{ account.permissions.join(", ") }}</p>
            <p><b>Capabilities:</b> {{ account.capabilities.join(", ") }}</p>
            <p class="muted">Last sync {{ account.lastSync }}</p>
            @if (account.providerError) {
              <p class="error">Provider error: {{ account.providerError }}</p>
            }
            <div class="actions">
              <button
                class="btn secondary"
                type="button"
                (click)="reconnect(account.platform)"
              >
                Reconnect</button
              ><button
                class="btn danger"
                type="button"
                (click)="disconnect(account.platform)"
              >
                Disconnect
              </button>
            </div>
          </article>
        }
      </div>
    </section>

    <div class="grid workspace" style="margin-top:1rem">
      <form
        class="card grid"
        [formGroup]="form"
        aria-labelledby="publisher-title"
      >
        <h2 id="publisher-title">Publishing details</h2>
        <div class="field">
          <label for="account">Account</label
          ><select id="account" formControlName="account">
            <option value="">Select connected account</option>
            @for (account of connectedAccounts(); track account.platform) {
              <option [value]="account.platform">
                {{ account.platform }} — {{ account.identity }}
              </option>
            }
          </select>
        </div>
        <div class="field">
          <label for="content">Approved content</label
          ><select id="content" formControlName="content">
            <option>August: Enlarged by Grace</option>
            <option>Youth Encounter invitation</option>
            <option>Sunday sermon quote</option></select
          ><small class="hint"
            >Content approval is separate from social publishing
            authorization.</small
          >
        </div>
        <div class="field">
          <label for="media">Media asset</label
          ><select id="media" formControlName="media">
            <option value="square">Square flyer · 1080×1080</option>
            <option value="portrait">Portrait flyer · 1080×1350</option>
            <option value="story">Story/Reel video · 1080×1920</option>
          </select>
        </div>
        <div class="field">
          <label for="caption">Caption</label
          ><textarea id="caption" rows="5" formControlName="caption"></textarea
          ><small class="hint"
            >{{ captionLength() }} / {{ captionLimit() }} characters · hashtags
            and links validated per platform.</small
          >
        </div>
        <div class="field">
          <label for="privacy">Privacy/mode</label
          ><select id="privacy" formControlName="privacy">
            <option>Public</option>
            <option>Followers</option>
            <option>Draft upload</option>
            <option>Direct post</option>
          </select>
        </div>
        <div class="field">
          <label for="date">Publish date and time</label
          ><input
            id="date"
            type="datetime-local"
            formControlName="date"
          /><small class="hint"
            >Scheduled in church time zone; DST changes require
            confirmation.</small
          >
        </div>
        <div class="field">
          <label for="approver">Publishing authorization</label
          ><input
            id="approver"
            formControlName="approver"
            placeholder="Publisher or approver name"
          />
        </div>
        @if (validationIssues().length) {
          <div class="card invalid">
            <b>Publishing requirements</b>
            <ul>
              @for (issue of validationIssues(); track issue) {
                <li>{{ issue }}</li>
              }
            </ul>
          </div>
        }
        <div class="actions">
          <button
            class="btn secondary"
            type="button"
            (click)="setState('Awaiting Approval')"
          >
            Submit for approval</button
          ><button class="btn" type="button" (click)="schedule()">
            Schedule</button
          ><button class="btn secondary" type="button" (click)="publishNow()">
            Publish now</button
          ><button class="btn secondary" type="button" (click)="retryFailed()">
            Retry failed</button
          ><button
            class="btn danger"
            type="button"
            (click)="setState('Cancelled')"
          >
            Cancel</button
          ><button
            class="btn secondary"
            type="button"
            (click)="setState('Manually Published')"
          >
            Mark manual
          </button>
        </div>
        <span class="badge">{{ state() }}</span>
      </form>
      <section class="card">
        <h2>Platform-specific previews</h2>
        <div class="grid previews">
          <article class="preview">
            <b>Facebook page/link</b>
            <p>{{ form.controls.caption.value }}</p>
            <div class="preview-media">Link card or square media</div>
          </article>
          <article class="preview">
            <b>Instagram feed / portrait / story / reel</b>
            <div class="preview-media">
              {{ form.controls.media.value }} preview with safe areas
            </div>
            <p>{{ form.controls.caption.value }}</p>
          </article>
          <article class="preview phone">
            <b>TikTok video / cover / privacy</b>
            <div class="preview-media">Vertical video and cover</div>
            <p>{{ form.controls.privacy.value }} · mode checked</p>
          </article>
        </div>
      </section>
    </div>

    <section class="card grid" style="margin-top:1rem">
      <h2>Publisher state model</h2>
      <div class="grid state-grid">
        @for (s of states; track s) {
          <span class="state" [class.invalid]="s === 'Failed'">{{ s }}</span>
        }
      </div>
      <h3>Audit history</h3>
      <div class="grid audit">
        @for (entry of audit(); track entry.correlationId) {
          <div class="audit-item">
            <b>{{ entry.action }}</b>
            <p>{{ entry.actor }} · {{ entry.at }}</p>
            <small>{{ entry.correlationId }}</small>
          </div>
        }
      </div>
    </section>
  `,
})
export class SocialPage {
  readonly states: readonly PublishingState[] = [
    "Draft",
    "Awaiting Approval",
    "Approved",
    "Scheduled",
    "Publishing",
    "Published",
    "Failed",
    "Cancelled",
    "Manually Published",
  ];
  readonly state = signal<PublishingState>("Draft");
  readonly accounts = signal<ConnectedAccount[]>([
    {
      platform: "Facebook",
      identity: "Sanctuary Chapel Page",
      tokenHealth: "Healthy",
      permissions: ["pages_show_list", "pages_manage_posts"],
      lastSync: "10 minutes ago",
      capabilities: ["page post", "link preview", "scheduled publish"],
      expires: "2026-09-04",
      state: "Connected",
    },
    {
      platform: "Instagram",
      identity: "@sanctuarychapel",
      tokenHealth: "Warning",
      permissions: ["instagram_basic", "instagram_content_publish"],
      lastSync: "1 hour ago",
      capabilities: ["feed", "portrait", "story", "reel"],
      expires: "2026-08-12",
      state: "Needs reconnect",
      providerError: "Permission review required for story publishing.",
    },
    {
      platform: "TikTok",
      identity: "Not connected",
      tokenHealth: "Expired",
      permissions: [],
      lastSync: "Never",
      capabilities: ["video", "cover", "privacy", "draft/direct modes"],
      expires: "expired",
      state: "Disconnected",
    },
  ]);
  readonly audit = signal<AuditEntry[]>([
    {
      at: "2026-08-05T09:10:00Z",
      actor: "Publisher",
      action: "Draft created",
      correlationId: "corr-social-001",
    },
  ]);
  readonly form = new FormGroup({
    account: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    content: new FormControl("August: Enlarged by Grace", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    media: new FormControl("square", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    caption: new FormControl(
      "Join us this Sunday as we declare enlargement by grace. #SanctuaryAI #SundayService",
      {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(2200)],
      },
    ),
    privacy: new FormControl("Public", { nonNullable: true }),
    date: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    approver: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  readonly connectedAccounts = computed(() =>
    this.accounts().filter((a) => a.state === "Connected"),
  );
  readonly captionLength = computed(
    () => this.form.controls.caption.value.length,
  );
  readonly captionLimit = computed(() =>
    this.form.controls.account.value === "TikTok" ? 2200 : 2200,
  );
  readonly validationIssues = computed(() => {
    const issues: string[] = [];
    const v = this.form.getRawValue();
    if (!v.account)
      issues.push("Choose a connected account with required permissions.");
    if (!v.caption.trim()) issues.push("Caption is required.");
    if (!v.date) issues.push("Schedule date and time are required.");
    if (!v.approver.trim())
      issues.push(
        "Publishing authorization must be recorded separately from content approval.",
      );
    if (v.account === "TikTok" && v.media !== "story")
      issues.push(
        "TikTok publishing requires a vertical video and cover frame.",
      );
    return issues;
  });
  connect(platform: SocialPlatform) {
    this.record(`Backend OAuth handoff started for ${platform}`);
  }
  reconnect(platform: SocialPlatform) {
    this.record(`Reconnect confirmed for ${platform}`);
  }
  disconnect(platform: SocialPlatform) {
    if (
      confirm(
        `Disconnect ${platform}? Scheduled posts will keep their audit history.`,
      )
    )
      this.record(`Disconnected ${platform}`);
  }
  schedule() {
    if (!this.validationIssues().length) this.setState("Scheduled");
  }
  publishNow() {
    if (!this.validationIssues().length) this.setState("Publishing");
  }
  retryFailed() {
    if (this.state() === "Failed") this.setState("Publishing");
  }
  setState(next: PublishingState) {
    this.state.set(next);
    this.record(`State changed to ${next}`);
  }
  private record(action: string) {
    this.audit.update((items) => [
      {
        at: new Date().toISOString(),
        actor: "Current user",
        action,
        correlationId: `corr-social-${items.length + 1}`,
      },
      ...items,
    ]);
  }
}
