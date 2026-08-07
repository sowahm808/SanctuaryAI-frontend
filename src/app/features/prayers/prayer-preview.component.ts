import { Component, input, output } from "@angular/core";
import {
  formatScripture,
  type PrayerPoint,
  type PrayerRecord,
} from "./prayer.models";
import { PrayerPointEditorComponent } from "./prayer-point-editor.component";
@Component({
  selector: "app-prayer-preview",
  standalone: true,
  imports: [PrayerPointEditorComponent],
  styles: [
    `
      .head,
      .metadata {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
      }
      .head h2 {
        margin: 0.2rem 0;
      }
      .metadata {
        justify-content: flex-start;
        flex-wrap: wrap;
        background: #f8f7fb;
        border-radius: 12px;
        padding: 0.8rem;
        margin: 1rem 0;
      }
      .metadata span {
        padding-right: 1rem;
      }
      .intro,
      .closing {
        font-family: Georgia, serif;
        font-size: 1.05rem;
        line-height: 1.7;
      }
      .closing {
        margin-top: 1rem;
        padding: 1rem;
        background: #f3effc;
        border-radius: 12px;
      }
      .empty {
        text-align: center;
        padding: 3rem 1rem;
      }
      .empty-icon {
        font-size: 2rem;
        color: var(--violet);
      }
    `,
  ],
  template: `<section class="card">
    @if (record(); as prayer) {
      <div class="head">
        <div>
          <p class="eyebrow">Generated prayer collection</p>
          <h2>{{ prayer.title }}</h2>
          <p class="muted">{{ prayer.brief.theme }}</p>
        </div>
        <span class="badge">v{{ prayer.revision }}</span>
      </div>
      <div class="metadata">
        <span
          ><small>Primary scripture</small><br /><b>{{
            scripture(prayer.brief.primaryScripture)
          }}</b></span
        ><span
          ><small>Category</small><br /><b>{{ prayer.brief.category }}</b></span
        ><span
          ><small>Tone</small><br /><b>{{ prayer.brief.tone }}</b></span
        >
      </div>
      @if (prayer.brief.supportingScriptures.length) {
        <div>
          <b>Supporting scriptures:</b>
          @for (ref of prayer.brief.supportingScriptures; track $index) {
            <span class="badge">{{ scripture(ref) }}</span>
          }
        </div>
      }
      @if (prayer.introduction) {
        <p class="intro">{{ prayer.introduction }}</p>
      }
      <app-prayer-point-editor
        [points]="prayer.points"
        [disabled]="prayer.status === 'approved'"
        (changed)="pointChanged.emit($event)"
        (reordered)="reordered.emit($event)"
        (action)="pointAction.emit($event)"
      />
      @if (prayer.closingDeclaration) {
        <div class="closing">
          <b>Closing declaration</b>
          <p>{{ prayer.closingDeclaration }}</p>
        </div>
      }
    } @else {
      <div class="empty">
        <div class="empty-icon">✦</div>
        <h2>Your generated collection will appear here</h2>
        <p class="muted">
          Complete the prayer brief, save your draft, then generate
          scripture-grounded prayer points.
        </p>
      </div>
    }
  </section>`,
})
export class PrayerPreviewComponent {
  readonly record = input<PrayerRecord | null>(null);
  readonly pointChanged = output<PrayerPoint>();
  readonly reordered = output<readonly PrayerPoint[]>();
  readonly pointAction = output<{
    point: PrayerPoint;
    action: "duplicate" | "delete" | "regenerate";
  }>();
  scripture = formatScripture;
}
