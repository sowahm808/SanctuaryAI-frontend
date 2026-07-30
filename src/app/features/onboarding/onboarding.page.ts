import { Component, computed, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      :host {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 280px 1fr;
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
        max-width: 760px;
      }
      .two {
        grid-template-columns: 1fr 1fr;
      }
      .actions {
        display: flex;
        justify-content: space-between;
        margin-top: 2rem;
      }
      @media (max-width: 700px) {
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
        Your progress is saved securely as you complete church setup.
      </p>
      <form class="grid" [formGroup]="form">
        @if (step() === 0) {
          <div class="field">
            <label>Church name</label><input formControlName="name" />
          </div>
          <div class="grid two">
            <div class="field">
              <label>Senior pastor</label><input formControlName="pastor" />
            </div>
            <div class="field">
              <label>Ministry slogan</label><input formControlName="slogan" />
            </div>
          </div>
        } @else if (step() === 1) {
          <div class="field">
            <label>Primary brand color</label
            ><input type="color" formControlName="color" />
          </div>
          <div class="field">
            <label>Church logo</label><input type="file" accept="image/*" />
          </div>
        } @else if (step() === 2) {
          <div class="field">
            <label>Preferred Bible translation</label
            ><select formControlName="translation">
              <option>NKJV</option>
              <option>NIV</option>
              <option>ESV</option>
              <option>KJV</option>
            </select>
          </div>
          <div class="field">
            <label>Doctrinal guidelines</label
            ><textarea rows="7" formControlName="doctrine"></textarea>
          </div>
        } @else {
          <div class="card">
            <h2>Ready to create</h2>
            <p>
              Your church identity, brand kit, doctrine, team, channels and
              campaign preferences can be reviewed before launch.
            </p>
            <span class="badge">Setup complete</span>
          </div>
        }
        <div class="actions">
          <button
            type="button"
            class="btn secondary"
            [disabled]="step() === 0"
            (click)="back()"
          >
            Back</button
          ><button type="button" class="btn" (click)="next()">
            {{ last() ? "Open SanctuaryAI" : "Save & continue" }}
          </button>
        </div>
      </form>
    </main>`,
})
export class OnboardingPage {
  readonly labels = [
    "Church identity",
    "Logo & brand kit",
    "Doctrine & ministry tone",
    "Team & social accounts",
    "First monthly campaign",
  ];
  readonly step = signal(0);
  readonly last = computed(() => this.step() === this.labels.length - 1);
  readonly form = new FormGroup({
    name: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    pastor: new FormControl("", { nonNullable: true }),
    slogan: new FormControl("", { nonNullable: true }),
    color: new FormControl("#5537a6", { nonNullable: true }),
    translation: new FormControl("NKJV", { nonNullable: true }),
    doctrine: new FormControl("", { nonNullable: true }),
  });
  constructor(private readonly router: Router) {}
  back() {
    this.step.update((v) => Math.max(v - 1, 0));
  }
  next() {
    if (this.last()) void this.router.navigateByUrl("/app/dashboard");
    else this.step.update((v) => v + 1);
  }
}
