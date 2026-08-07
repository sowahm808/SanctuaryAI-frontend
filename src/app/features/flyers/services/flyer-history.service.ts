import { Injectable, computed, signal } from "@angular/core";
@Injectable({ providedIn: "root" })
export class FlyerHistoryService {
  private readonly undoItems = signal<string[]>([]);
  private readonly redoItems = signal<string[]>([]);
  readonly canUndo = computed(() => this.undoItems().length > 0);
  readonly canRedo = computed(() => this.redoItems().length > 0);
  capture(json: unknown) {
    this.undoItems.update((x) => [...x.slice(-49), JSON.stringify(json)]);
    this.redoItems.set([]);
  }
  undo(current: unknown) {
    return this.move(this.undoItems, this.redoItems, current);
  }
  redo(current: unknown) {
    return this.move(this.redoItems, this.undoItems, current);
  }
  clear() {
    this.undoItems.set([]);
    this.redoItems.set([]);
  }
  private move(
    source: typeof this.undoItems,
    target: typeof this.redoItems,
    current: unknown,
  ) {
    const items = source();
    const value = items.at(-1);
    if (!value) return null;
    source.set(items.slice(0, -1));
    target.update((x) => [...x.slice(-49), JSON.stringify(current)]);
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
}
