import { Component, computed, inject, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { finalize, switchMap } from "rxjs";
import { SessionService } from "../../services/session.service";
import { ChurchProfileService } from "./church-profile.service";

const DRAFT_KEY = "sanctuary-onboarding-draft-v3";
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: [
    `
      :host {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 300px 1fr;
      }
      .steps {
        background: #241747;
        color: white;
        padding: 2rem;
      }
      .steps div {
        padding: 0.65rem;
        border-left: 2px solid #ffffff30;
      }
      .steps .active {
        border-color: #bc9cff;
        background: #ffffff10;
      }
      .main {
        padding: clamp(1.5rem, 5vw, 5rem);
      }
      form {
        max-width: 860px;
      }
      .two {
        grid-template-columns: 1fr 1fr;
      }
      .actions,
      .inline {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
      }
      .actions {
        justify-content: space-between;
        margin-top: 2rem;
      }
      .upload {
        border: 1px dashed var(--line);
        border-radius: 18px;
        padding: 1rem;
      }
      progress {
        width: 100%;
      }
      @media (max-width: 760px) {
        :host {
          display: block;
        }
        .steps {
          padding: 1rem;
        }
        .steps div:not(.active) {
          display: none;
        }
        .two {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<aside class="steps">
      <h2>✦ SanctuaryAI</h2>
      <p>Organization setup</p>
      @for (s of labels; track s; let i = $index) {
        <div [class.active]="i === step()">{{ i + 1 }}. {{ s }}</div>
      }
    </aside>
    <main class="main">
      <p class="eyebrow">Step {{ step() + 1 }} of {{ labels.length }}</p>
      <h1>{{ labels[step()] }}</h1>
      <p class="muted">
        Progress autosaves locally and can be recovered even if invitations,
        uploads, or social handoffs fail.
      </p>
      <form class="grid" [formGroup]="form">
        @switch (step()) {
          @case (0) {
            <div class="field">
              <label>Create or join</label
              ><select formControlName="setupMode">
                <option value="create">Create a new church</option>
                <option value="join">Join with invitation</option>
              </select>
            </div>
            @if (form.controls.setupMode.value === "join") {
              <div class="field">
                <label>Invitation code</label
                ><input formControlName="invitationCode" />
              </div>
            }
          }
          @case (1) {
            <div class="field">
              <label>Church name</label><input formControlName="name" />
            </div>
            <div class="grid two">
              <div class="field">
                <label>Senior pastor</label
                ><input formControlName="seniorPastor" />
              </div>
              <div class="field">
                <label>Ministry slogan</label><input formControlName="slogan" />
              </div>
            </div>
            <div class="field">
              <label>Description</label
              ><textarea rows="4" formControlName="description"></textarea>
            </div>
          }
          @case (2) {
            <div class="grid two">
              <div class="field">
                <label>Primary brand color</label
                ><input type="color" formControlName="primaryColor" />
              </div>
              <div class="field">
                <label>Secondary brand color</label
                ><input type="color" formControlName="secondaryColor" />
              </div>
            </div>
            <div class="grid two">
              <div class="field">
                <label>Heading font</label
                ><input formControlName="headingFont" />
              </div>
              <div class="field">
                <label>Body font</label><input formControlName="bodyFont" />
              </div>
            </div>
          }
          @case (3) {
            <div class="grid two">
              <div class="upload">
                <label>Primary logo</label
                ><input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  (change)="selectLogo($event, 'primaryLogo')"
                /><progress [value]="uploadProgress()" max="100"></progress
                ><input
                  placeholder="Alt text"
                  formControlName="primaryLogoAlt"
                />
              </div>
              <div class="upload">
                <label>Secondary logo</label
                ><input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  (change)="selectLogo($event, 'secondaryLogo')"
                /><progress [value]="uploadProgress()" max="100"></progress
                ><input
                  placeholder="Alt text"
                  formControlName="secondaryLogoAlt"
                />
              </div>
            </div>
            <p class="muted">
              PNG, JPG, WebP, or SVG up to 5 MB. Crop instructions can be saved
              below.
            </p>
            <div class="field">
              <label>Crop notes / safe area</label
              ><input formControlName="logoCropInstructions" />
            </div>
          }
          @case (4) {
            <div class="field">
              <label>Physical address</label
              ><textarea rows="3" formControlName="physicalAddress"></textarea>
            </div>
            <div class="field">
              <label>Digital address / livestream</label
              ><input formControlName="digitalAddress" />
            </div>
            <div class="grid two">
              <div class="field">
                <label>Phone</label><input formControlName="phone" />
              </div>
              <div class="field">
                <label>Email</label
                ><input type="email" formControlName="email" />
              </div>
            </div>
            <div class="field">
              <label>Website</label
              ><input type="url" formControlName="website" />
            </div>
          }
          @case (5) {
            <div class="field">
              <label>Social channels</label
              ><textarea
                rows="4"
                formControlName="socialChannels"
                placeholder="Facebook, Instagram, TikTok, YouTube..."
              ></textarea>
            </div>
            <div class="grid two">
              <div class="field">
                <label>Service days</label
                ><input
                  formControlName="serviceDays"
                  placeholder="Sunday, Wednesday"
                />
              </div>
              <div class="field">
                <label>Service times</label
                ><input
                  formControlName="serviceTimes"
                  placeholder="9:00 AM, 11:00 AM"
                />
              </div>
            </div>
          }
          @case (6) {
            <div class="grid two">
              <div class="field">
                <label>Bible translation</label
                ><select formControlName="bibleTranslation">
                  <option>NKJV</option>
                  <option>NIV</option>
                  <option>ESV</option>
                  <option>KJV</option>
                  <option>NLT</option>
                </select>
              </div>
              <div class="field">
                <label>Ministry tone</label
                ><input formControlName="ministryTone" />
              </div>
            </div>
            <div class="field">
              <label>Statement of faith</label
              ><textarea rows="5" formControlName="statementOfFaith"></textarea>
            </div>
          }
          @case (7) {
            <div class="field">
              <label>Doctrinal guidelines</label
              ><textarea
                rows="6"
                formControlName="doctrinalGuidelines"
              ></textarea>
            </div>
            <div class="field">
              <label>Prohibited content</label
              ><textarea
                rows="4"
                formControlName="prohibitedContent"
              ></textarea>
            </div>
            <div class="grid two">
              <div class="field">
                <label>Default hashtags</label
                ><input formControlName="hashtags" />
              </div>
              <div class="field">
                <label>Default footer</label
                ><input formControlName="defaultFooter" />
              </div>
            </div>
          }
          @case (8) {
            <div class="field">
              <label>Team invitations</label
              ><textarea
                rows="4"
                formControlName="teamInvitations"
                placeholder="name@email.com, role"
              ></textarea>
            </div>
            <p class="muted">
              Invitations are queued after profile creation; failures will not
              discard onboarding progress.
            </p>
          }
          @case (9) {
            <div class="field">
              <label>Social account handoff notes</label
              ><textarea
                rows="4"
                formControlName="socialConnectionNotes"
              ></textarea>
            </div>
            <a class="btn secondary" routerLink="/app/social-publisher"
              >Open social connections later</a
            >
          }
          @case (10) {
            <div class="field">
              <label>First monthly campaign</label
              ><select formControlName="firstCampaignChoice">
                <option value="create">Create after onboarding</option>
                <option value="defer">Intentionally defer</option>
              </select>
            </div>
            <div class="card">
              <h2>Completion status</h2>
              <p>{{ completionStatus() }}</p>
              <span class="badge">{{
                form.valid ? "Ready" : "Needs required fields"
              }}</span>
            </div>
          }
        }
        <div class="actions">
          <button
            type="button"
            class="btn secondary"
            [disabled]="step() === 0"
            (click)="back()"
          >
            Back</button
          ><span class="muted">{{ savedMessage() }}</span
          ><button type="button" class="btn secondary" (click)="saveAndExit()">
            Save & exit</button
          ><button
            type="button"
            class="btn"
            [disabled]="saving()"
            (click)="next()"
          >
            {{
              saving()
                ? "Saving..."
                : last()
                  ? "Finish onboarding"
                  : "Save & continue"
            }}
          </button>
        </div>
        @if (error()) {
          <p class="muted" role="alert">{{ error() }}</p>
        }
      </form>
    </main>`,
})
export class OnboardingPage {
  readonly labels = [
    "Path",
    "Identity",
    "Brand colors",
    "Logos",
    "Contact",
    "Services",
    "Voice",
    "Doctrine",
    "Team",
    "Social",
    "Campaign",
  ];
  private readonly profiles = inject(ChurchProfileService);
  private readonly session = inject(SessionService);
  readonly step = signal(0);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly savedMessage = signal("Not saved yet");
  readonly uploadProgress = signal(0);
  readonly last = computed(() => this.step() === this.labels.length - 1);
  readonly form = new FormGroup({
    setupMode: new FormControl("create", { nonNullable: true }),
    invitationCode: new FormControl("", { nonNullable: true }),
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    slogan: new FormControl("", { nonNullable: true }),
    description: new FormControl("", { nonNullable: true }),
    seniorPastor: new FormControl("", { nonNullable: true }),
    primaryColor: new FormControl("#5537a6", { nonNullable: true }),
    secondaryColor: new FormControl("#f4b740", { nonNullable: true }),
    headingFont: new FormControl("Inter", { nonNullable: true }),
    bodyFont: new FormControl("Inter", { nonNullable: true }),
    primaryLogo: new FormControl("", { nonNullable: true }),
    secondaryLogo: new FormControl("", { nonNullable: true }),
    primaryLogoAlt: new FormControl("", { nonNullable: true }),
    secondaryLogoAlt: new FormControl("", { nonNullable: true }),
    logoCropInstructions: new FormControl("", { nonNullable: true }),
    physicalAddress: new FormControl("", { nonNullable: true }),
    digitalAddress: new FormControl("", { nonNullable: true }),
    phone: new FormControl("", { nonNullable: true }),
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.email],
    }),
    website: new FormControl("", { nonNullable: true }),
    socialChannels: new FormControl("", { nonNullable: true }),
    serviceDays: new FormControl("", { nonNullable: true }),
    serviceTimes: new FormControl("", { nonNullable: true }),
    bibleTranslation: new FormControl("NKJV", { nonNullable: true }),
    ministryTone: new FormControl("Pastoral, hopeful, biblically grounded", {
      nonNullable: true,
    }),
    statementOfFaith: new FormControl("", { nonNullable: true }),
    doctrinalGuidelines: new FormControl("", { nonNullable: true }),
    prohibitedContent: new FormControl("", { nonNullable: true }),
    hashtags: new FormControl("", { nonNullable: true }),
    defaultFooter: new FormControl("", { nonNullable: true }),
    teamInvitations: new FormControl("", { nonNullable: true }),
    socialConnectionNotes: new FormControl("", { nonNullable: true }),
    firstCampaignChoice: new FormControl("create", { nonNullable: true }),
  });
  constructor(private readonly router: Router) {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved)
      this.form.patchValue(
        JSON.parse(saved) as Partial<typeof this.form.value>,
      );
    this.form.valueChanges.subscribe(() => this.persist());
  }
  back(): void {
    this.step.update((v) => Math.max(v - 1, 0));
    this.persist();
  }
  next(): void {
    this.error.set("");
    this.persist();
    if (!this.validateCurrentStep()) return;
    if (!this.last()) {
      this.step.update((v) => v + 1);
      return;
    }
    this.finish();
  }
  saveAndExit(): void {
    this.persist();
    void this.router.navigateByUrl("/app/dashboard");
  }
  selectLogo(event: Event, control: "primaryLogo" | "secondaryLogo"): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (
      !IMAGE_TYPES.includes(file.type as (typeof IMAGE_TYPES)[number]) ||
      file.size > MAX_LOGO_BYTES
    ) {
      this.error.set(
        "Logo must be PNG, JPG, WebP, or SVG and no larger than 5 MB.",
      );
      this.form.controls[control].setValue("");
      return;
    }
    this.uploadProgress.set(35);
    this.form.controls[control].setValue(file.name);
    setTimeout(() => this.uploadProgress.set(100), 250);
  }
  completionStatus(): string {
    return this.form.valid
      ? "All required onboarding data is valid and ready to submit."
      : "Complete required fields before finishing onboarding.";
  }
  private validateCurrentStep(): boolean {
    if (
      this.step() === 0 &&
      this.form.controls.setupMode.value === "join" &&
      !this.form.controls.invitationCode.value.trim()
    ) {
      this.error.set("Enter the invitation code to join a church.");
      return false;
    }
    if (this.step() === 1 && !this.form.controls.name.value.trim()) {
      this.form.controls.name.markAsTouched();
      this.error.set("Church name is required.");
      return false;
    }
    if (this.form.controls.email.invalid) {
      this.error.set("Enter a valid public church email or leave it blank.");
      return false;
    }
    return true;
  }
  private persist(): void {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(this.form.getRawValue()));
    this.savedMessage.set("Saved locally");
  }
  private finish(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set("Resolve validation errors before finishing onboarding.");
      return;
    }
    this.saving.set(true);
    this.profiles
      .create(this.form.getRawValue())
      .pipe(
        switchMap(() => this.session.refresh()),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          localStorage.removeItem(DRAFT_KEY);
          void this.router.navigateByUrl(
            this.form.controls.firstCampaignChoice.value === "create"
              ? "/app/monthly-campaigns"
              : "/app/dashboard",
          );
        },
        error: () =>
          this.error.set(
            "We could not finish onboarding. Your local draft is preserved for recovery.",
          ),
      });
  }
}
