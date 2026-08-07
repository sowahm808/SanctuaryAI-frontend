import { Component, input, output } from "@angular/core";
import { FormArray, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { PRAYER_CATEGORIES, PRAYER_TONES } from "./prayer.models";

@Component({
  selector: "app-prayer-brief-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      form,
      .section,
      .scripture,
      .advanced-grid {
        display: grid;
        gap: 1rem;
      }
      .section {
        padding-top: 0.25rem;
      }
      .section + .section {
        border-top: 1px solid var(--line);
        padding-top: 1.25rem;
      }
      .section-title {
        margin: 0;
        font-size: 1rem;
      }
      .two {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      .scripture {
        grid-template-columns: 2fr 0.7fr 1fr;
      }
      .supporting {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border: 0;
        border-radius: 999px;
        background: #f0ecfb;
        color: #432a91;
        padding: 0.45rem 0.7rem;
      }
      .add-row {
        display: grid;
        grid-template-columns: 2fr 0.65fr 1fr auto;
        gap: 0.5rem;
      }
      .toggle {
        display: flex;
        gap: 0.6rem;
        align-items: center;
      }
      .toggle input {
        width: auto;
      }
      .error {
        color: var(--danger);
        font-size: 0.78rem;
      }
      details summary {
        font-weight: 800;
        cursor: pointer;
      }
      .advanced-grid {
        margin-top: 1rem;
      }
      @media (max-width: 560px) {
        .two,
        .scripture,
        .add-row {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<form class="card" [formGroup]="form()" aria-label="Prayer brief">
    <div class="section">
      <div>
        <p class="eyebrow">Prayer brief</p>
        <h2>Collection setup</h2>
      </div>
      <div class="field">
        <label for="prayer-title"
          >Collection title <span class="muted">(optional)</span></label
        ><input
          id="prayer-title"
          formControlName="title"
          placeholder="Financial Empowerment Prayers"
        />
      </div>
      <div class="field">
        <label for="theme">Theme</label
        ><textarea
          id="theme"
          formControlName="theme"
          rows="2"
          aria-describedby="theme-help"
        ></textarea
        ><small id="theme-help" class="muted"
          >Describe the ministry focus for this collection.</small
        >
      </div>
      <div class="two">
        <div class="field">
          <label for="quantity">Prayer point quantity</label
          ><input
            id="quantity"
            type="number"
            min="1"
            max="100"
            formControlName="quantity"
          />
          @if (
            form().controls["quantity"].touched &&
            form().controls["quantity"].invalid
          ) {
            <span class="error" role="alert"
              >Enter between 1 and 100 points.</span
            >
          }
        </div>
        <div class="field">
          <label for="category">Prayer category</label
          ><select id="category" formControlName="category">
            @for (option of categories; track option) {
              <option [value]="option">{{ option }}</option>
            }
          </select>
        </div>
      </div>
      <div class="field">
        <label for="tone">Tone</label
        ><select id="tone" formControlName="tone">
          @for (option of tones; track option) {
            <option [value]="option">{{ option }}</option>
          }
        </select>
      </div>
    </div>
    <div class="section">
      <h3 class="section-title">Scripture foundation</h3>
      <div class="scripture" formGroupName="primaryScripture">
        <div class="field">
          <label for="book">Book</label
          ><input id="book" formControlName="book" placeholder="3 John" />
        </div>
        <div class="field">
          <label for="chapter">Chapter</label
          ><input
            id="chapter"
            type="number"
            min="1"
            formControlName="chapter"
          />
        </div>
        <div class="field">
          <label for="verses">Verse / range</label
          ><input id="verses" formControlName="verses" placeholder="2 or 1–3" />
        </div>
      </div>
      <div>
        <label>Supporting scriptures</label>
        <div class="supporting">
          @for (ref of supporting().controls; track $index) {
            <button
              class="chip"
              type="button"
              (click)="removeSupporting.emit($index)"
              [attr.aria-label]="'Remove ' + ref.value.book"
            >
              {{ ref.value.book }} {{ ref.value.chapter }}:{{
                ref.value.verses
              }}
              ×
            </button>
          } @empty {
            <small class="muted">No supporting scriptures added.</small>
          }
        </div>
      </div>
      <div class="add-row" [formGroup]="supportingInput()">
        <div class="field">
          <label for="support-book">Book</label
          ><input id="support-book" formControlName="book" />
        </div>
        <div class="field">
          <label for="support-chapter">Chapter</label
          ><input
            id="support-chapter"
            type="number"
            min="1"
            formControlName="chapter"
          />
        </div>
        <div class="field">
          <label for="support-verses">Verses</label
          ><input id="support-verses" formControlName="verses" />
        </div>
        <button
          class="btn secondary"
          type="button"
          (click)="addSupporting.emit()"
        >
          Add
        </button>
      </div>
    </div>
    <div class="section">
      <details>
        <summary>Advanced options</summary>
        <div class="advanced-grid" formGroupName="advancedOptions">
          @for (toggle of toggles; track toggle.key) {
            <label class="toggle"
              ><input type="checkbox" [formControlName]="toggle.key" />
              {{ toggle.label }}</label
            >
          }
          <div class="two">
            <div class="field">
              <label for="translation">Bible translation</label
              ><select id="translation" formControlName="bibleTranslation">
                <option>NKJV</option>
                <option>KJV</option>
                <option>NIV</option>
                <option>ESV</option>
                <option>NLT</option>
              </select>
            </div>
            <div class="field">
              <label for="audience">Audience</label
              ><select id="audience" formControlName="audience">
                <option>Congregation</option>
                <option>Prayer team</option>
                <option>Leaders</option>
                <option>Personal devotion</option>
                <option>Online community</option>
              </select>
            </div>
          </div>
          <div class="field">
            <label for="context">Service context</label
            ><input id="context" formControlName="serviceContext" />
          </div>
          <div class="field">
            <label for="campaign">Campaign or theme association</label
            ><input id="campaign" formControlName="campaign" />
          </div>
        </div>
      </details>
    </div>
  </form>`,
})
export class PrayerBriefFormComponent {
  readonly form = input.required<FormGroup>();
  readonly supporting = input.required<FormArray<FormGroup>>();
  readonly supportingInput = input.required<FormGroup>();
  readonly addSupporting = output<void>();
  readonly removeSupporting = output<number>();
  readonly categories = PRAYER_CATEGORIES;
  readonly tones = PRAYER_TONES;
  readonly toggles = [
    { key: "includeScriptureText", label: "Include scripture text" },
    { key: "includeDeclaration", label: "Declaration after each prayer" },
    { key: "includeCongregationalResponse", label: "Congregational response" },
    { key: "includeIntroduction", label: "Prayer introduction" },
    { key: "includeClosingDeclaration", label: "Closing declaration" },
  ];
}
