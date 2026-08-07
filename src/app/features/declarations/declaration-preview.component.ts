import { Component, input } from "@angular/core";
import type { DeclarationRecord } from "./declaration.models";
import { declarationTitle } from "./declaration.models";
@Component({
  selector: "app-declaration-preview",
  standalone: true,
  styles: [
    `
      article {
        padding: clamp(1.3rem, 3vw, 2.4rem);
      }
      .content {
        font-family: Georgia, serif;
        font-size: 1.08rem;
        line-height: 1.8;
        white-space: pre-wrap;
      }
      .scripture {
        color: var(--violet);
        font-weight: 650;
      }
      .supporting {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
    `,
  ],
  template: `<article class="card">
    <p class="eyebrow">Generated declaration</p>
    @if (record()?.variants?.length) {
      <h2>{{ title(record()!) }}</h2>
      <p class="scripture">{{ record()!.brief.primaryScripture.reference }}</p>
      <div class="supporting">
        @for (s of record()!.brief.supportingScriptures; track s.reference) {
          <span class="badge">{{ s.reference }}</span>
        }
      </div>
      @if (full()) {
        <div class="content">{{ full()!.content }}</div>
      }
      @if (record()!.closingResponse) {
        <footer>
          <b>Closing response</b>
          <p>{{ record()!.closingResponse }}</p>
        </footer>
      }
    } @else {
      <h2>Your generated declaration will appear here</h2>
      <p class="muted">
        Generate a declaration to preview the current version.
      </p>
    }
  </article>`,
})
export class DeclarationPreviewComponent {
  record = input<DeclarationRecord | null>(null);
  title = declarationTitle;
  full = () => this.record()?.variants.find((v) => v.kind === "full");
}
