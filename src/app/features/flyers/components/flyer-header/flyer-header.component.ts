import { Component, input, output } from "@angular/core";
import type {
  FlyerRenderStatus,
  FlyerWorkflowStatus,
} from "../../flyer.models";
@Component({
  selector: "app-flyer-header",
  standalone: true,
  template: `<header>
    <div>
      <p class="eyebrow">Creative workflow</p>
      <h1>Flyer Studio</h1>
      <div class="badges">
        <span>Workflow · {{ workflow().replace("_", " ") }}</span
        ><span>Render · {{ render().replace("_", " ") }}</span
        ><span>Editor · {{ dirty() ? "Unsaved changes" : "Saved" }}</span>
      </div>
    </div>
    <div class="actions">
      <button class="btn secondary" (click)="save.emit()" [disabled]="saving()">
        {{ saving() ? "Saving…" : "Save Draft" }}</button
      ><button class="btn" (click)="generate.emit()" [disabled]="generating()">
        {{ generating() ? "Rendering…" : "Generate / Render" }}</button
      ><button
        class="btn secondary"
        (click)="review.emit()"
        [disabled]="!canReview()"
      >
        Submit for Review</button
      ><button class="btn secondary" (click)="openExport.emit()">Export</button>
    </div>
  </header>`,
  styles: [
    `
      header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
        margin-bottom: 1rem;
      }
      .actions,
      .badges {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .badges span {
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        background: #f0ecfa;
        font-size: 0.8rem;
        text-transform: capitalize;
      }
      @media (max-width: 700px) {
        header {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class FlyerHeaderComponent {
  workflow = input.required<FlyerWorkflowStatus>();
  render = input.required<FlyerRenderStatus>();
  dirty = input.required<boolean>();
  saving = input(false);
  generating = input(false);
  canReview = input(false);
  save = output();
  generate = output();
  review = output();
  openExport = output();
}
