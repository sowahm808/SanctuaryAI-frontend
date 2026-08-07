import { Component, input } from "@angular/core";
import type { ReviewContentType } from "./reviews.models";

@Component({
  selector: "app-review-content-preview",
  standalone: true,
  styles: [
    `
      dl {
        margin: 0;
      }
      dt {
        font-weight: 700;
        margin-top: 0.75rem;
      }
      dd {
        margin: 0.2rem 0 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }
      pre {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-size: 0.82rem;
      }
      img,
      video {
        display: block;
        max-width: 100%;
        max-height: 24rem;
        margin-top: 0.5rem;
        border-radius: 8px;
      }
    `,
  ],
  template: `
    @if (fields().length) {
      <dl>
        @for (field of fields(); track field.key) {
          <dt>{{ label(field.key) }}</dt>
          <dd>{{ display(field.value) }}</dd>
          @if (isMedia(field.key, field.value)) {
            <img [src]="field.value" [alt]="label(field.key)" />
          }
        }
      </dl>
    } @else {
      <pre>{{ fallback() }}</pre>
    }
  `,
})
export class ReviewContentPreviewComponent {
  readonly contentType = input.required<ReviewContentType>();
  readonly content = input.required<unknown>();
  fields(): { key: string; value: unknown }[] {
    const value = this.content();
    if (!value || typeof value !== "object" || Array.isArray(value)) return [];
    return Object.entries(value as Record<string, unknown>).map(
      ([key, field]) => ({ key, value: field }),
    );
  }
  label(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/_/g, " ")
      .replace(/^./, (c) => c.toUpperCase());
  }
  display(value: unknown): string {
    if (value === null || value === undefined || value === "") return "—";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    )
      return String(value);
    return JSON.stringify(value, null, 2);
  }
  fallback(): string {
    return this.display(this.content());
  }
  isMedia(key: string, value: unknown): value is string {
    return (
      typeof value === "string" &&
      /^(https?:\/\/|\/)/.test(value) &&
      /(image|media|asset|thumbnail|url)/i.test(key)
    );
  }
}
