import { Component, input, output } from "@angular/core";
import {
  ReactiveFormsModule,
  FormControl,
  FormGroup,
  FormArray,
} from "@angular/forms";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import {
  AUDIENCES,
  DECLARATION_TONES,
  DECLARATION_TYPES,
  SERVICE_TYPES,
} from "./declaration.models";
@Component({
  selector: "app-declaration-brief-form",
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
      section {
        padding: 1.3rem;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .full {
        grid-column: 1/-1;
      }
      label {
        display: grid;
        gap: 0.4rem;
        font-weight: 650;
      }
      input,
      select,
      textarea {
        width: 100%;
        box-sizing: border-box;
      }
      .checks {
        display: grid;
        gap: 0.65rem;
      }
      .checks label {
        display: flex;
        align-items: center;
        font-weight: 500;
      }
      .chip {
        display: inline-flex;
        gap: 0.4rem;
        align-items: center;
        background: #f0ecfa;
        border-radius: 999px;
        padding: 0.35rem 0.65rem;
        margin: 0.25rem;
      }
      .scripture-add {
        display: flex;
        gap: 0.5rem;
      }
      details {
        border-top: 1px solid var(--line);
        padding-top: 1rem;
      }
      summary {
        font-weight: 700;
        cursor: pointer;
      }
      @media (max-width: 620px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .full {
          grid-column: auto;
        }
      }
    `,
  ],
  template: `<section class="card" [formGroup]="form()">
    <div class="section-head">
      <div>
        <p class="eyebrow">Declaration brief</p>
        <h2>Shape the ministry message</h2>
      </div>
    </div>
    <div class="grid">
      <label class="full"
        >Title
        <input
          formControlName="title"
          placeholder="Divine Enlargement Declaration"
      /></label>
      <label
        >Declaration type
        <select formControlName="declarationType" required>
          @for (v of types; track v) {
            <option [value]="v">{{ v }}</option>
          }
        </select></label
      >
      <label
        >Tone
        <select formControlName="tone" required>
          @for (v of tones; track v) {
            <option [value]="v">{{ v }}</option>
          }
        </select></label
      >
      <label class="full"
        >Audience
        <select
          formControlName="audience"
          multiple
          aria-describedby="audience-help"
        >
          @for (v of audiences; track v) {
            <option [value]="v">{{ v }}</option>
          }</select
        ><small id="audience-help" class="muted"
          >Choose one or more ministry audiences.</small
        ></label
      >
      <div class="full" formGroupName="primaryScripture">
        <label
          >Primary scripture
          <input
            formControlName="reference"
            placeholder="Isaiah 54:2-3"
            required
        /></label>
      </div>
      <div class="full">
        <label>Supporting scriptures</label>
        @for (s of supporting().controls; track $index) {
          <span class="chip"
            >{{ s.value.reference }}
            <button
              type="button"
              class="icon-btn"
              (click)="removeSupporting.emit($index)"
              [attr.aria-label]="'Remove ' + s.value.reference"
            >
              ×
            </button></span
          >
        }
        <div class="scripture-add" [formGroup]="supportingInput()">
          <input
            formControlName="reference"
            placeholder="Psalm 115:14"
            aria-label="Supporting scripture"
          /><button
            class="btn secondary"
            type="button"
            (click)="addSupporting.emit()"
          >
            Add
          </button>
        </div>
      </div>
      <div formGroupName="serviceContext" class="full grid">
        <label
          >Service type
          <select formControlName="serviceType">
            <option value="">Select service</option>
            @for (v of services; track v) {
              <option [value]="v">{{ v }}</option>
            }
          </select></label
        ><label>Event / campaign <input formControlName="event" /></label
        ><label>Occasion <input formControlName="occasion" /></label
        ><mat-form-field
          ><mat-label>Service date</mat-label
          ><input
            matInput
            [matDatepicker]="picker"
            formControlName="date" /><mat-datepicker-toggle
            matIconSuffix
            [for]="picker" /><mat-datepicker #picker /></mat-form-field
        ><label class="full"
          >Additional context
          <textarea rows="3" formControlName="notes"></textarea>
        </label>
      </div>
      <label class="full"
        >What should this declaration accomplish?
        <textarea
          rows="3"
          formControlName="objective"
          placeholder="Declare enlargement over the congregation"
        ></textarea>
      </label>
      <details class="full" formGroupName="advancedOptions">
        <summary>Advanced options</summary>
        <label
          >Length
          <select formControlName="length">
            <option value="short">Short</option>
            <option value="standard">Standard</option>
            <option value="extended">Extended</option>
          </select></label
        >
        <div class="checks">
          @for (option of advanced; track option.key) {
            <label
              ><input type="checkbox" [formControlName]="option.key" />
              {{ option.label }}</label
            >
          }
        </div>
      </details>
    </div>
  </section>`,
})
export class DeclarationBriefFormComponent {
  form = input.required<FormGroup>();
  supporting = input.required<FormArray<FormGroup>>();
  supportingInput = input.required<FormGroup>();
  addSupporting = output<void>();
  removeSupporting = output<number>();
  readonly types = DECLARATION_TYPES;
  readonly tones = DECLARATION_TONES;
  readonly audiences = AUDIENCES;
  readonly services = SERVICE_TYPES;
  readonly advanced = [
    {
      key: "includeScriptureQuotations",
      label: "Include scripture quotations",
    },
    {
      key: "includeCongregationalResponse",
      label: "Include congregational response",
    },
    { key: "includeAmenResponse", label: "Include Amen response" },
    { key: "includeSocialVersion", label: "Include short social version" },
    { key: "includeFlyerVersion", label: "Include flyer headline" },
    {
      key: "includeVideoVoiceoverVersion",
      label: "Include video voice-over version",
    },
    { key: "includePersonalVersion", label: "Include first-person version" },
    {
      key: "includeCongregationalVersion",
      label: "Include plural / congregational version",
    },
  ];
}
