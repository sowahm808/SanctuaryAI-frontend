import { Component, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { DraftRepository } from "../../core/persistence/draft.repository";
import type {
  CampaignSection,
  EntityId,
  IsoDateTime,
} from "../../models/domain.models";
import { PlatformStateService } from "../../services/platform-state.service";

interface MonthlyCampaignDraftPayload {
  form: {
    month: string;
    focus: string;
    scripture: string;
    tone: string;
    quantity: number;
  };
  sections: CampaignSection[];
}

const MONTHLY_CAMPAIGN_DRAFT_KEY = "monthly-campaign:current";
const LOCAL_ORGANIZATION_ID = "local" as EntityId;
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .split {
        grid-template-columns: 340px 1fr;
      }
      .sections {
        grid-template-columns: repeat(2, 1fr);
      }
      .section {
        display: flex;
        gap: 1rem;
        align-items: center;
      }
      .ring {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: grid;
        place-items: center;
        background: #eee9fb;
        color: var(--violet);
        font-weight: 800;
      }
      .form {
        display: grid;
        gap: 1rem;
      }
      .toolbar {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .section .btn {
        margin-left: auto;
      }
      @media (max-width: 900px) {
        .split,
        .sections {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<div class="toolbar">
      <div>
        <p class="eyebrow">Campaign builder</p>
        <h1>Build a monthly ministry plan</h1>
        <p class="muted">
          Generate each section asynchronously, review it, then lock approved
          work.
        </p>
      </div>
      <button class="btn" (click)="generateAll()">✦ Generate all</button>
    </div>
    <div class="grid split">
      <form class="card form" [formGroup]="form">
        <h2>Campaign brief</h2>
        <div class="field">
          <label>Month</label><input type="month" formControlName="month" />
        </div>
        <div class="field">
          <label>Spiritual focus</label
          ><input
            formControlName="focus"
            placeholder="e.g. Kingdom authority"
          />
        </div>
        <div class="field">
          <label>Main scripture</label
          ><input
            formControlName="scripture"
            placeholder="Book chapter:verse"
          />
        </div>
        <div class="field">
          <label>Preferred tone</label
          ><select formControlName="tone">
            <option>Pastoral</option>
            <option>Prophetic</option>
            <option>Teaching</option>
          </select>
        </div>
        <div class="field">
          <label>Prayer point quantity</label
          ><input type="number" min="1" max="50" formControlName="quantity" />
        </div>
        <button
          type="button"
          class="btn secondary"
          [disabled]="savingDraft()"
          (click)="saveDraft()"
        >
          {{ savingDraft() ? "Saving…" : "Save draft" }}
        </button>
        <p class="muted" role="status" aria-live="polite">
          {{ draftStatus() }}
        </p>
      </form>
      <section>
        <h2>Campaign completion</h2>
        <div class="grid sections">
          @for (s of sections(); track s.id) {
            <article class="card section">
              <div class="ring">{{ s.progress }}%</div>
              <div>
                <b>{{ s.title }}</b
                ><br /><span class="muted">{{ s.status }}</span>
              </div>
              <button
                class="btn secondary"
                [disabled]="s.locked"
                (click)="generate(s.id)"
              >
                {{ s.progress ? "Open" : "Generate" }}
              </button>
            </article>
          }
        </div>
      </section>
    </div>`,
})
export class CampaignPage {
  private readonly drafts = inject(DraftRepository);
  private readonly platform = inject(PlatformStateService);
  readonly savingDraft = signal(false);
  readonly draftStatus = signal("Not saved yet");
  readonly form = new FormGroup({
    month: new FormControl("2026-08", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    focus: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    scripture: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    tone: new FormControl("Pastoral", { nonNullable: true }),
    quantity: new FormControl(20, { nonNullable: true }),
  });
  readonly sections = signal<CampaignSection[]>(
    [
      "Theme of the Month",
      "Pastoral introduction",
      "Spiritual objectives",
      "Monthly declaration",
      "Prayer collection",
      "Weekly sermon series",
      "Weekly flyer plan",
      "Social media plan",
      "Short-form video plan",
      "Publishing calendar",
    ].map((title, index) => ({
      id: String(index),
      title,
      progress: index < 2 ? 100 : 0,
      status: index < 2 ? "Approved" : "Draft",
      locked: index < 2,
    })),
  );
  async saveDraft(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.draftStatus.set("Complete the required brief fields before saving.");
      this.platform.notify({
        tone: "warning",
        title: "Draft not saved",
        message: "Month, spiritual focus, and main scripture are required.",
      });
      return;
    }

    this.savingDraft.set(true);
    const savedAt = new Date().toISOString() as IsoDateTime;
    const formValue = this.form.getRawValue();
    const payload: MonthlyCampaignDraftPayload = {
      form: formValue,
      sections: this.sections(),
    };

    try {
      await this.drafts.save({
        key: MONTHLY_CAMPAIGN_DRAFT_KEY,
        organizationId: LOCAL_ORGANIZATION_ID,
        feature: "monthly-campaigns",
        payload,
        localRevision: Date.now(),
        updatedAt: savedAt,
        syncState: "local",
      });

      this.draftStatus.set(
        `Draft saved locally at ${new Date(savedAt).toLocaleTimeString()}.`,
      );
      this.platform.notify({
        tone: "success",
        title: "Draft saved",
        message: "Monthly campaign draft was saved locally for recovery.",
      });
    } catch {
      this.draftStatus.set("Draft could not be saved. Please try again.");
      this.platform.notify({
        tone: "error",
        title: "Draft save failed",
        message: "Your monthly campaign draft could not be saved locally.",
      });
    } finally {
      this.savingDraft.set(false);
    }
  }

  generate(id: string) {
    this.sections.update((items) =>
      items.map((s) =>
        s.id === id ? { ...s, progress: 100, status: "Awaiting Approval" } : s,
      ),
    );
  }
  generateAll() {
    this.sections.update((items) =>
      items.map((s) =>
        s.locked ? s : { ...s, progress: 100, status: "Awaiting Approval" },
      ),
    );
  }
}
