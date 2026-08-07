import { Component, input, output } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
import {
  FLYER_TYPES,
  type FlyerBrief,
  type FlyerType,
  type LinkedResourceType,
} from "../../flyer.models";
@Component({
  selector: "app-flyer-brief",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `<section>
    <h2>Flyer brief</h2>
    <form [formGroup]="form">
      <label>Title<input formControlName="title" required /></label
      ><label>Subtitle<input formControlName="subtitle" /></label
      ><label
        >Flyer type<select formControlName="flyerType">
          @for (t of types; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select></label
      ><label
        >Campaign<input
          formControlName="campaignId"
          placeholder="Choose campaign" /></label
      ><label
        >Linked content<select formControlName="linkedResourceType">
          <option value="">None</option>
          @for (t of linkedTypes; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select></label
      ><label
        >Primary scripture<input formControlName="primaryScripture" /></label
      ><label
        >Supporting scriptures<input
          [value]="form.controls.supportingScriptures.value.join(', ')"
          (change)="scriptures($event)"
      /></label>
      <div class="pair">
        <label>Date<input type="date" formControlName="eventDate" /></label
        ><label>Time<input type="time" formControlName="eventTime" /></label>
      </div>
      <label>Venue<input formControlName="venue" /></label
      ><label>Speaker / Minister<input formControlName="speaker" /></label
      ><label>CTA<input formControlName="cta" /></label
      ><label>Audience<input formControlName="audience" /></label
      ><label>Website<input type="url" formControlName="website" /></label
      ><label>Contact<input formControlName="contact" /></label
      ><label
        >Additional notes<textarea formControlName="notes"></textarea>
      </label>
    </form>
  </section>`,
  styles: [
    `
      form {
        display: grid;
        gap: 0.65rem;
      }
      label {
        display: grid;
        gap: 0.25rem;
        font-size: 0.8rem;
      }
      .pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      input,
      select,
      textarea {
        width: 100%;
      }
    `,
  ],
})
export class FlyerBriefComponent {
  readonly types = FLYER_TYPES;
  readonly linkedTypes: readonly {
    value: LinkedResourceType;
    label: string;
  }[] = [
    { value: "campaign", label: "Campaign" },
    { value: "monthly_theme", label: "Monthly Theme" },
    { value: "sermon", label: "Sermon" },
    { value: "prayer_collection", label: "Prayer Collection" },
    { value: "prophetic_declaration", label: "Prophetic Declaration" },
    { value: "calendar_event", label: "Calendar Event" },
  ];
  value = input.required<FlyerBrief>();
  changed = output<FlyerBrief>();
  readonly form = new FormGroup({
    title: new FormControl("", { nonNullable: true }),
    subtitle: new FormControl("", { nonNullable: true }),
    flyerType: new FormControl<FlyerType>("announcement", {
      nonNullable: true,
    }),
    campaignId: new FormControl("", { nonNullable: true }),
    linkedResourceType: new FormControl<LinkedResourceType | "">("", {
      nonNullable: true,
    }),
    linkedResourceId: new FormControl("", { nonNullable: true }),
    primaryScripture: new FormControl("", { nonNullable: true }),
    supportingScriptures: new FormControl<string[]>([], { nonNullable: true }),
    eventDate: new FormControl("", { nonNullable: true }),
    eventTime: new FormControl("", { nonNullable: true }),
    venue: new FormControl("", { nonNullable: true }),
    speaker: new FormControl("", { nonNullable: true }),
    cta: new FormControl("", { nonNullable: true }),
    audience: new FormControl("", { nonNullable: true }),
    website: new FormControl("", { nonNullable: true }),
    contact: new FormControl("", { nonNullable: true }),
    notes: new FormControl("", { nonNullable: true }),
  });
  constructor() {
    this.form.valueChanges.subscribe(() =>
      this.changed.emit(this.form.getRawValue()),
    );
  }
  setValue(v: FlyerBrief) {
    this.form.setValue(v, { emitEvent: false });
  }
  scriptures(e: Event) {
    this.form.controls.supportingScriptures.setValue(
      (e.target as HTMLInputElement).value
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
    );
  }
}
