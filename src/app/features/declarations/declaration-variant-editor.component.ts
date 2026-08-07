import { Component, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { DeclarationVariant, RefineAction } from "./declaration.models";
import { VARIANT_LABELS } from "./declaration.models";
@Component({
  selector: "app-declaration-variant-editor",
  standalone: true,
  imports: [FormsModule],
  styles: [
    `
      section {
        padding: 1.3rem;
      }
      .tabs,
      .actions,
      .refine {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .tabs button.active {
        background: var(--violet);
        color: white;
      }
      .variant {
        margin-top: 1rem;
      }
      .copy {
        white-space: pre-wrap;
        line-height: 1.7;
      }
      textarea {
        width: 100%;
        box-sizing: border-box;
      }
      .refine {
        border-top: 1px solid var(--line);
        padding-top: 1rem;
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Variants</p>
    <h2>Declaration formats</h2>
    @if (!variants().length) {
      <p class="muted">Generated variants will appear here.</p>
    } @else {
      <div class="tabs" role="tablist">
        @for (v of variants(); track v.id) {
          <button
            class="btn secondary"
            role="tab"
            [class.active]="active() === v.id"
            [attr.aria-selected]="active() === v.id"
            (click)="choose(v)"
          >
            {{ labels[v.kind] }}
          </button>
        }
      </div>
      @if (current(); as v) {
        <div class="variant">
          @if (editing()) {
            <textarea
              rows="12"
              [(ngModel)]="draft"
              [attr.aria-label]="'Edit ' + labels[v.kind]"
            ></textarea>
          } @else {
            <div class="copy">{{ v.content }}</div>
          }
          <div class="actions">
            @if (editing()) {
              <button
                class="btn"
                (click)="save.emit(withContent(v)); editing.set(false)"
              >
                Save
              </button>
            } @else {
              <button
                class="btn secondary"
                (click)="draft = v.content; editing.set(true)"
              >
                Edit
              </button>
            }
            <button class="btn secondary" (click)="copy(v.content)">Copy</button
            ><button
              class="btn secondary"
              (click)="action.emit({ variant: v, action: 'duplicate' })"
            >
              Duplicate</button
            ><button
              class="btn secondary"
              (click)="action.emit({ variant: v, action: 'regenerate' })"
            >
              Regenerate this variant
            </button>
          </div>
          <h3>Refine with AI</h3>
          <div class="refine">
            @for (r of refinements; track r.action) {
              <button
                class="btn secondary"
                (click)="refine.emit({ variant: v, action: r.action })"
              >
                {{ r.label }}
              </button>
            }
          </div>
        </div>
      }
    }
  </section>`,
})
export class DeclarationVariantEditorComponent {
  variants = input.required<readonly DeclarationVariant[]>();
  save = output<DeclarationVariant>();
  action = output<{
    variant: DeclarationVariant;
    action: "duplicate" | "regenerate";
  }>();
  refine = output<{ variant: DeclarationVariant; action: RefineAction }>();
  active = signal<string | null>(null);
  editing = signal(false);
  draft = "";
  labels = VARIANT_LABELS;
  current = () =>
    this.variants().find(
      (v) => v.id === (this.active() || this.variants()[0]?.id),
    );
  choose(v: DeclarationVariant) {
    this.active.set(v.id);
    this.editing.set(false);
  }
  withContent(v: DeclarationVariant) {
    return { ...v, content: this.draft };
  }
  copy(s: string) {
    void navigator.clipboard.writeText(s);
  }
  refinements = [
    { action: "more_prophetic", label: "Make more prophetic" },
    { action: "more_scriptural", label: "Make more scriptural" },
    { action: "more_concise", label: "Make more concise" },
    { action: "stronger", label: "Make stronger" },
    { action: "more_pastoral", label: "Make more pastoral" },
    { action: "covenant_language", label: "Add covenant language" },
    { action: "congregational_response", label: "Add congregational response" },
    { action: "social_version", label: "Create social version" },
    { action: "flyer_version", label: "Create flyer version" },
    { action: "voiceover_version", label: "Create voice-over version" },
  ] as const;
}
