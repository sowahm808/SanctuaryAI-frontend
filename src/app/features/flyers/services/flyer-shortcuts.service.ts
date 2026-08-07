import { Injectable } from "@angular/core";
import { FlyerCanvasService } from "./flyer-canvas.service";
@Injectable({ providedIn: "root" })
export class FlyerShortcutsService {
  constructor(private canvas: FlyerCanvasService) {}
  handle(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.shiftKey ? this.canvas.redo() : this.canvas.undo();
    } else if (
      (event.ctrlKey || event.metaKey) &&
      event.key.toLowerCase() === "y"
    ) {
      event.preventDefault();
      this.canvas.redo();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.canvas.removeSelected();
    }
  }
}
