import { Component, input, output } from "@angular/core";
import {
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import type { AudienceType } from "./theme.models";
@Component({
  selector: "app-theme-brief-form",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  styles: [
    `
      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .wide {
        grid-column: 1/-1;
      }
      .entry {
        display: flex;
        gap: 0.5rem;
        margin: 0.4rem 0;
      }
      .audiences {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .check {
        border: 1px solid var(--line);
        padding: 0.55rem 0.7rem;
        border-radius: 99px;
      }
      mat-form-field {
        width: 100%;
      }
      @media (max-width: 650px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        .wide {
          grid-column: auto;
        }
      }
    `,
  ],
  template: `<form class="card form-grid" [formGroup]="form()">
    <div class="wide">
      <p class="eyebrow">Theme brief</p>
      <h2>Pastoral direction</h2>
    </div>
    <mat-form-field
      ><mat-label>Month and year</mat-label
      ><input
        matInput
        [matDatepicker]="picker"
        [value]="monthDate()"
        readonly /><mat-datepicker-toggle
        matIconSuffix
        [for]="picker"
      ></mat-datepicker-toggle
      ><mat-datepicker
        #picker
        startView="multi-year"
        (monthSelected)="chooseMonth($event, picker)"
      ></mat-datepicker
    ></mat-form-field>
    <div class="field">
      <label for="topic">Topic</label
      ><input id="topic" formControlName="topic" />
    </div>
    <div class="field wide">
      <label for="main-scripture">Main scripture</label
      ><input
        id="main-scripture"
        formControlName="mainScripture"
        placeholder="John 10:10"
      />
    </div>
    <fieldset class="wide" formArrayName="supportingScriptures">
      <legend>Supporting scriptures</legend>
      @for (c of scriptures.controls; track $index) {
        <div class="entry">
          <input
            [formControlName]="$index"
            [attr.aria-label]="'Supporting scripture ' + ($index + 1)"
          /><button
            class="btn secondary"
            type="button"
            (click)="removeScripture($index)"
          >
            Remove
          </button>
        </div>
      }
      <button class="btn secondary" type="button" (click)="addScripture()">
        + Add scripture
      </button>
    </fieldset>
    <div class="field wide">
      <label for="emphasis">Spiritual emphasis</label
      ><textarea
        id="emphasis"
        rows="4"
        formControlName="spiritualEmphasis"
      ></textarea>
    </div>
    <div class="field wide">
      <label for="notes">Pastor notes</label
      ><textarea id="notes" rows="5" formControlName="pastorNotes"></textarea>
    </div>
    <div class="field">
      <label for="previous">Previous theme</label
      ><input id="previous" formControlName="previousTheme" />
    </div>
    <fieldset>
      <legend>Upcoming events</legend>
      <div formArrayName="upcomingEvents">
        @for (c of events.controls; track $index) {
          <div class="entry">
            <input
              type="text"
              [formControlName]="$index"
              placeholder="Event name / date"
            /><button
              type="button"
              class="btn secondary"
              (click)="events.removeAt($index)"
            >
              Remove
            </button>
          </div>
        }
      </div>
      <button
        type="button"
        class="btn secondary"
        (click)="events.push(control())"
      >
        + Add event
      </button>
    </fieldset>
    <div class="field">
      <label for="tone">Tone</label
      ><select id="tone" formControlName="tone">
        <option [ngValue]="null">Select tone</option>
        <option value="pastoral">Pastoral</option>
        <option value="prophetic">Prophetic</option>
        <option value="teaching">Teaching</option>
        <option value="evangelistic">Evangelistic</option>
      </select>
    </div>
    <fieldset>
      <legend>Intended audience</legend>
      <div class="audiences">
        @for (a of audiences; track a.value) {
          <label class="check"
            ><input
              type="checkbox"
              [checked]="hasAudience(a.value)"
              (change)="toggleAudience(a.value, $event)"
            />
            {{ a.label }}</label
          >
        }
      </div>
    </fieldset>
    @if (form().invalid && form().touched) {
      <p class="error wide">
        Choose a month and year, then complete topic, main scripture, spiritual
        emphasis, tone, and audience.
      </p>
    }
  </form>`,
})
export class ThemeBriefFormComponent {
  readonly form = input.required<FormGroup>();
  readonly changed = output();
  readonly audiences = [
    { value: "whole-church", label: "Whole church" },
    { value: "adults", label: "Adults" },
    { value: "youth", label: "Youth" },
    { value: "families", label: "Families" },
    { value: "leaders", label: "Leaders" },
  ] as const;
  get scriptures() {
    return this.form().get("supportingScriptures") as FormArray<
      FormControl<string>
    >;
  }
  get events() {
    return this.form().get("upcomingEvents") as FormArray<FormControl<string>>;
  }
  control() {
    return new FormControl("", { nonNullable: true });
  }
  addScripture() {
    this.scriptures.push(this.control());
  }
  removeScripture(i: number) {
    if (this.scriptures.length > 1) this.scriptures.removeAt(i);
  }
  monthDate() {
    const m = this.form().get("month")?.value,
      y = this.form().get("year")?.value;
    return m && y ? new Date(y, m - 1, 1) : null;
  }
  chooseMonth(d: Date, p: { close(): void }) {
    this.form().patchValue({ month: d.getMonth() + 1, year: d.getFullYear() });
    this.form().markAsDirty();
    p.close();
    this.changed.emit();
  }
  hasAudience(a: AudienceType) {
    return (
      this.form().get("intendedAudience")?.value as AudienceType[]
    ).includes(a);
  }
  toggleAudience(a: AudienceType, e: Event) {
    const c = this.form().get("intendedAudience") as FormControl<
      AudienceType[]
    >;
    const checked = (e.target as HTMLInputElement).checked;
    c.setValue(checked ? [...c.value, a] : c.value.filter((x) => x !== a));
    c.markAsDirty();
  }
}
