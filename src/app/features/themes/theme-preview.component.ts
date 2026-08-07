import { Component, input } from "@angular/core";
import type { ApiProblem, GeneratedTheme } from "./theme.models";
@Component({
  selector: "app-theme-preview",
  standalone: true,
  styles: [
    `
      .preview {
        background: linear-gradient(145deg, #281a50, #6447bd);
        color: #fff;
        border-radius: 18px;
        padding: clamp(1.4rem, 4vw, 2.6rem);
        min-height: 270px;
      }
      .preview h2,
      .preview h3 {
        color: #fff;
      }
      .section {
        border-top: 1px solid #ffffff30;
        margin-top: 1rem;
        padding-top: 1rem;
      }
      .tags {
        color: #e5ddff;
      }
      .skeleton {
        height: 17rem;
        border-radius: 16px;
        background: linear-gradient(90deg, #eee, #fafafa, #eee);
      }
    `,
  ],
  template: `<section class="card">
    <p class="eyebrow">Generated theme preview</p>
    <h2>Ministry direction</h2>
    @if (loading()) {
      <div class="skeleton" aria-label="Loading generated theme"></div>
    } @else if (error()) {
      <div class="error" role="alert">
        {{ error()?.message }}
        @if (error()?.correlationId) {
          <small>Reference: {{ error()?.correlationId }}</small>
        }
      </div>
    } @else if (theme(); as t) {
      <article class="preview">
        <h2>{{ t.themeTitle || t.title }}</h2>
        @if (t.subtitle) {
          <h3>{{ t.subtitle }}</h3>
        }
        <p><b>Main scripture</b> {{ t.mainScripture }}</p>
        @if (t.supportingScriptures?.length || t.scriptures?.length) {
          <p>{{ (t.supportingScriptures || t.scriptures)?.join(" · ") }}</p>
        }
        @if (t.explanation) {
          <p>{{ t.explanation }}</p>
        }
        @if (t.pastoralIntroduction) {
          <div class="section">
            <h3>Pastoral introduction</h3>
            <p>{{ t.pastoralIntroduction }}</p>
          </div>
        }
        @if (t.objectives?.length) {
          <div class="section">
            <h3>Objectives</h3>
            <ul>
              @for (x of t.objectives; track x) {
                <li>{{ x }}</li>
              }
            </ul>
          </div>
        }
        @if (t.weeklyTeachingDirection?.length) {
          <div class="section">
            <h3>Weekly teaching direction</h3>
            <ol>
              @for (x of t.weeklyTeachingDirection; track x) {
                <li>{{ x }}</li>
              }
            </ol>
          </div>
        }
        @if (t.monthlyConfession || t.confession) {
          <div class="section">
            <h3>Confession</h3>
            <p>{{ t.monthlyConfession || t.confession }}</p>
          </div>
        }
        @if (t.propheticDeclaration) {
          <div class="section">
            <h3>Prophetic declaration</h3>
            <p>{{ t.propheticDeclaration }}</p>
          </div>
        }
        @if (t.flyerHeadline) {
          <div class="section">
            <h3>Flyer headline</h3>
            <p>{{ t.flyerHeadline }}</p>
          </div>
        }
        @if (t.designConcept) {
          <div class="section">
            <h3>Design concept</h3>
            <p>{{ t.designConcept }}</p>
          </div>
        }
        <p class="tags">{{ t.hashtags?.join(" ") }}</p>
      </article>
    } @else {
      <div class="empty">
        <b>Your generated theme will appear here.</b>
        <p>Complete the pastoral brief, save, then generate.</p>
      </div>
    }
  </section>`,
})
export class ThemePreviewComponent {
  readonly theme = input<GeneratedTheme | null>();
  readonly loading = input(false);
  readonly error = input<ApiProblem | null>(null);
}
