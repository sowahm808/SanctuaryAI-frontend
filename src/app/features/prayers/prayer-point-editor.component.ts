import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { formatScripture, type PrayerPoint } from "./prayer.models";
@Component({
  selector: "app-prayer-point-editor",
  standalone: true,
  imports: [FormsModule, DragDropModule],
  styles: [
    `
      .points {
        display: grid;
        gap: 0.85rem;
      }
      .point {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 1rem;
        padding: 1rem;
        border: 1px solid var(--line);
        border-radius: 14px;
        background: #fff;
      }
      .number {
        display: grid;
        place-items: center;
        width: 2.4rem;
        height: 2.4rem;
        border-radius: 50%;
        background: #eee9fb;
        color: var(--violet);
        font-weight: 900;
      }
      .label {
        display: block;
        color: var(--muted);
        font-size: 0.7rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .text {
        line-height: 1.65;
      }
      .edit {
        width: 100%;
        min-height: 90px;
        border: 1px solid var(--focus-ring);
        border-radius: 9px;
        padding: 0.75rem;
      }
      .tools {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
        margin-top: 0.7rem;
      }
      .tools button {
        border: 1px solid var(--line);
        border-radius: 8px;
        background: #fff;
        padding: 0.4rem 0.55rem;
      }
      .handle {
        cursor: grab;
      }
      .declaration {
        border-left: 3px solid #bdaee9;
        padding-left: 0.7rem;
      }
      @media (max-width: 500px) {
        .point {
          grid-template-columns: 1fr;
        }
        .number {
          width: 2rem;
          height: 2rem;
        }
      }
    `,
  ],
  template: `<div
    class="points"
    cdkDropList
    (cdkDropListDropped)="dropped($event)"
  >
    @for (point of points(); track point.id; let index = $index) {
      <article class="point" cdkDrag>
        <div class="number">{{ String(index + 1).padStart(2, "0") }}</div>
        <div>
          <span class="label">Prayer point</span>
          @if (editingId() === point.id) {
            <textarea class="edit" [(ngModel)]="draftText"></textarea>
          } @else {
            <p class="text">{{ point.text }}</p>
          }
          @if (point.scripture) {
            <p><span class="label">Scripture</span>{{ scripture(point) }}</p>
          }
          @if (point.declaration) {
            <p class="declaration">
              <span class="label">Declaration</span>{{ point.declaration }}
            </p>
          }
          <div class="tools">
            <button type="button" (click)="toggleEdit(point)">
              {{ editingId() === point.id ? "Cancel" : "Edit" }}
            </button>
            @if (editingId() === point.id) {
              <button type="button" (click)="save(point)">Save</button>
            }
            <button
              class="handle"
              type="button"
              cdkDragHandle
              aria-label="Reorder prayer point"
            >
              ↕ Reorder</button
            ><button
              type="button"
              (click)="action.emit({ point, action: 'duplicate' })"
            >
              Duplicate</button
            ><button
              type="button"
              (click)="action.emit({ point, action: 'regenerate' })"
            >
              Regenerate</button
            ><button
              type="button"
              (click)="action.emit({ point, action: 'delete' })"
            >
              Delete
            </button>
          </div>
        </div>
      </article>
    }
  </div>`,
})
export class PrayerPointEditorComponent {
  readonly points = input.required<readonly PrayerPoint[]>();
  readonly disabled = input(false);
  readonly changed = output<PrayerPoint>();
  readonly reordered = output<readonly PrayerPoint[]>();
  readonly action = output<{
    point: PrayerPoint;
    action: "duplicate" | "delete" | "regenerate";
  }>();
  editingId = () => this._editing;
  private _editing: string | null = null;
  draftText = "";
  readonly String = String;
  scripture(p: PrayerPoint) {
    return formatScripture(p.scripture);
  }
  toggleEdit(p: PrayerPoint) {
    if (this.disabled()) return;
    this._editing = this._editing === p.id ? null : p.id;
    this.draftText = p.text;
  }
  save(p: PrayerPoint) {
    if (this.draftText.trim())
      this.changed.emit({ ...p, text: this.draftText.trim() });
    this._editing = null;
  }
  dropped(event: CdkDragDrop<readonly PrayerPoint[]>) {
    if (this.disabled()) return;
    const copy = [...this.points()];
    moveItemInArray(copy, event.previousIndex, event.currentIndex);
    this.reordered.emit(copy);
  }
}
