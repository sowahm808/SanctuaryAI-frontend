import { Component, input, output } from "@angular/core";

export type ViewState = "empty" | "offline" | "denied" | "error";

@Component({
  selector: "app-state-panel",
  standalone: true,
  styles: [
    `
      :host {
        display: block;
      }
      .state {
        display: grid;
        justify-items: center;
        gap: 0.65rem;
        padding: 2.5rem 1.25rem;
        text-align: center;
      }
      .icon {
        display: grid;
        place-items: center;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: #f0ecfa;
        color: var(--violet);
        font-size: 1.35rem;
      }
      h3,
      p {
        margin: 0;
      }
      p {
        color: var(--muted);
        max-width: 36rem;
      }
    `,
  ],
  template: `
    <section class="card state" role="status" aria-live="polite">
      <span class="icon" aria-hidden="true">{{ icon() }}</span>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      @if (actionLabel()) {
        <button class="btn secondary" type="button" (click)="action.emit()">
          {{ actionLabel() }}
        </button>
      }
    </section>
  `,
})
export class StatePanelComponent {
  readonly state = input<ViewState>("empty");
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly actionLabel = input("");
  readonly action = output<void>();
  protected icon(): string {
    return { empty: "◇", offline: "⌁", denied: "⊘", error: "!" }[this.state()];
  }
}

@Component({
  selector: "app-progress",
  standalone: true,
  styles: [
    `
      .row {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 0.4rem;
        font-size: 0.78rem;
      }
      .track {
        height: 8px;
        overflow: hidden;
        border-radius: 99px;
        background: #eceaf1;
      }
      .bar {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, var(--violet), #9b7de2);
        transition: width 0.2s;
      }
    `,
  ],
  template: `<div class="row">
      <span>{{ label() }}</span
      ><strong>{{ value() }}%</strong>
    </div>
    <div
      class="track"
      role="progressbar"
      [attr.aria-label]="label()"
      aria-valuemin="0"
      aria-valuemax="100"
      [attr.aria-valuenow]="value()"
    >
      <div class="bar" [style.width.%]="value()"></div>
    </div>`,
})
export class ProgressComponent {
  readonly label = input("Progress");
  readonly value = input(0, {
    transform: (value: number) => Math.max(0, Math.min(100, value)),
  });
}

@Component({
  selector: "app-skeleton",
  standalone: true,
  styles: [
    `
      .skeleton {
        height: 1rem;
        border-radius: 6px;
        background: linear-gradient(
          90deg,
          #eeedf2 25%,
          #f8f7fa 50%,
          #eeedf2 75%
        );
        background-size: 200% 100%;
        animation: shine 1.4s infinite;
      }
      @keyframes shine {
        to {
          background-position: -200% 0;
        }
      }
    `,
  ],
  template: `<div class="skeleton" role="status">
    <span class="sr-only">Loading</span>
  </div>`,
})
export class SkeletonComponent {}

@Component({
  selector: "app-confirm-dialog",
  standalone: true,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        display: grid;
        place-items: center;
        padding: 1rem;
        background: #15102099;
      }
      .dialog {
        width: min(440px, 100%);
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.65rem;
        margin-top: 1.5rem;
      }
    `,
  ],
  template: `@if (open()) {
    <div class="backdrop" (click)="cancel.emit()">
      <section
        class="card dialog"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-labelledby]="dialogTitle"
        (click)="$event.stopPropagation()"
      >
        <h2 [id]="dialogTitle">{{ title() }}</h2>
        <p class="muted">{{ message() }}</p>
        <div class="actions">
          <button class="btn secondary" type="button" (click)="cancel.emit()">
            Cancel</button
          ><button class="btn danger" type="button" (click)="confirm.emit()">
            {{ confirmLabel() }}
          </button>
        </div>
      </section>
    </div>
  }`,
})
export class ConfirmDialogComponent {
  readonly open = input(false);
  readonly title = input("Confirm action");
  readonly message = input.required<string>();
  readonly confirmLabel = input("Confirm");
  readonly confirm = output<void>();
  readonly cancel = output<void>();
  protected readonly dialogTitle = `dialog-${crypto.randomUUID()}`;
}
