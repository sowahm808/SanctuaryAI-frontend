import { Component, input, output } from "@angular/core";
import type { FlyerSize } from "../../flyer.models";
import { FLYER_SIZES } from "../../flyer.models";
@Component({
  selector: "app-flyer-toolbar",
  standalone: true,
  template: `<div class="toolbar" role="toolbar" aria-label="Canvas tools">
    <button (click)="action.emit('undo')">↶ Undo</button
    ><button (click)="action.emit('redo')">↷ Redo</button
    ><button (click)="action.emit('text')">Text</button
    ><button (click)="action.emit('shape')">Shape</button
    ><button (click)="qr.emit()">QR code</button
    ><button (click)="action.emit('duplicate')">Duplicate</button
    ><button (click)="action.emit('group')">Group</button
    ><button (click)="action.emit('ungroup')">Ungroup</button
    ><button (click)="action.emit('center')">Center</button
    ><button (click)="action.emit('delete')">Delete</button
    ><button (click)="action.emit('gradient')">Gradient</button
    ><button (click)="action.emit('crop')" [disabled]="!imageSelected()">
      Crop image</button
    ><label
      >Size<select
        [value]="size()"
        (change)="sizeChange.emit($any($event.target).value)"
      >
        @for (s of sizes; track s) {
          <option>{{ s }}</option>
        }
      </select></label
    ><label
      >Zoom<input
        type="range"
        min="30"
        max="120"
        [value]="zoom()"
        (input)="zoomChange.emit(+$any($event.target).value)"
    /></label>
  </div>`,
  styles: [
    `
      .toolbar {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        flex-wrap: wrap;
        padding: 0.7rem;
        background: white;
        border: 1px solid var(--line);
        border-radius: 12px;
      }
      .toolbar label {
        display: flex;
        align-items: center;
        gap: 0.3rem;
      }
    `,
  ],
})
export class FlyerToolbarComponent {
  sizes = FLYER_SIZES;
  zoom = input.required<number>();
  size = input.required<FlyerSize>();
  imageSelected = input(false);
  action = output<string>();
  qr = output();
  zoomChange = output<number>();
  sizeChange = output<FlyerSize>();
}
