import { Component, inject } from "@angular/core";
import { PlatformStateService } from "../services/platform-state.service";

@Component({
  selector: "app-toast-region",
  standalone: true,
  styles: [
    `
      :host {
        position: fixed;
        z-index: 80;
        right: 1rem;
        bottom: 1rem;
        display: grid;
        gap: 0.65rem;
        width: min(360px, calc(100vw - 2rem));
      }
      .toast {
        padding: 1rem;
        border-left: 4px solid var(--violet);
      }
      .toast.error {
        border-color: var(--danger);
      }
      .toast.success {
        border-color: var(--green);
      }
      strong,
      p {
        display: block;
        margin: 0;
      }
      p {
        margin-top: 0.25rem;
        color: var(--muted);
        font-size: 0.84rem;
      }
      button {
        float: right;
        border: 0;
        background: transparent;
      }
    `,
  ],
  template: `<div aria-live="polite" aria-atomic="true">
    @for (toast of state.notifications(); track toast.id) {
      <article class="card toast" [class]="toast.tone">
        <button
          type="button"
          aria-label="Dismiss notification"
          (click)="state.dismiss(toast.id)"
        >
          ×</button
        ><strong>{{ toast.title }}</strong>
        <p>{{ toast.message }}</p>
      </article>
    }
  </div>`,
})
export class ToastRegionComponent {
  protected readonly state = inject(PlatformStateService);
}
