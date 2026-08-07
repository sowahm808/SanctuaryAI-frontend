import { Injectable, signal } from "@angular/core";
import {
  ActiveSelection,
  Canvas,
  FabricImage,
  FabricObject,
  FabricText,
  Gradient,
  Group,
  Rect,
} from "fabric";
import type {
  BrandKitView,
  FlyerSize,
  FlyerTemplateView,
  MediaAssetView,
} from "../flyer.models";
import { FlyerHistoryService } from "./flyer-history.service";
export interface FlyerLayerView {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  type: string;
}
@Injectable({ providedIn: "root" })
export class FlyerCanvasService {
  readonly layers = signal<readonly FlyerLayerView[]>([]);
  readonly activeSelection = signal<FlyerLayerView | null>(null);
  readonly zoom = signal(55);
  readonly dirty = signal(false);
  readonly ready = signal(false);
  readonly announcement = signal("Canvas not ready");
  readonly changeVersion = signal(0);
  private canvas?: Canvas;
  private sequence = 0;
  constructor(private history: FlyerHistoryService) {}
  initialize(element: HTMLCanvasElement, width: number, height: number) {
    this.canvas = new Canvas(element, {
      backgroundColor: "#27194e",
      preserveObjectStacking: true,
      selection: true,
      width,
      height,
    });
    this.canvas.on("selection:created", () =>
      this.sync("Selection changed", false),
    );
    this.canvas.on("selection:updated", () =>
      this.sync("Selection changed", false),
    );
    this.canvas.on("selection:cleared", () =>
      this.sync("No layer selected", false),
    );
    this.ready.set(true);
    this.sync("Canvas ready", false);
  }
  destroy() {
    void this.canvas?.dispose();
    this.canvas = undefined;
    this.ready.set(false);
  }
  serialize() {
    FabricObject.customProperties = ["id", "assetId", "qrTarget", "name"];
    return this.canvas?.toJSON() ?? {};
  }
  async deserialize(json: unknown, markDirty = false) {
    if (!this.canvas) return;
    await this.canvas.loadFromJSON(json as Record<string, unknown>);
    this.canvas.renderAll();
    this.history.clear();
    this.dirty.set(markDirty);
    this.sync("Canvas restored", false);
  }
  markSaved() {
    this.dirty.set(false);
  }
  addText(text = "Edit this text") {
    this.mutate(
      () =>
        this.canvas?.add(
          new FabricText(text, {
            left: 80,
            top: 120,
            fontSize: 32,
            fill: "#fff",
            id: this.id("text"),
            objectCaching: false,
          }),
        ),
      "Text layer added",
    );
  }
  addShape() {
    this.mutate(
      () =>
        this.canvas?.add(
          new Rect({
            left: 100,
            top: 220,
            width: 180,
            height: 100,
            fill: "#7457cb",
            id: this.id("shape"),
            rx: 8,
            ry: 8,
          }),
        ),
      "Shape layer added",
    );
  }
  async addImage(asset: MediaAssetView, extra: Record<string, unknown> = {}) {
    if (!this.canvas) return;
    this.history.capture(this.serialize());
    const image = await FabricImage.fromURL(asset.url, {
      crossOrigin: "anonymous",
    });
    image.set({
      left: 60,
      top: 60,
      assetId: asset.id,
      id: this.id("image"),
      name: asset.name,
      ...extra,
    });
    image.scaleToWidth(Math.min(260, this.canvas.width * 0.6));
    this.canvas.add(image);
    this.sync("Image added", true);
  }
  async addQrCode(asset: MediaAssetView, targetUrl: string) {
    await this.addImage(asset, {
      qrTarget: targetUrl,
      name: `QR: ${targetUrl}`,
    });
  }
  duplicate() {
    const selected = this.canvas?.getActiveObject();
    if (!selected || !this.canvas) return;
    this.history.capture(this.serialize());
    void selected
      .clone(["id", "assetId", "qrTarget"])
      .then((copy: FabricObject) => {
        copy.set({
          left: (selected.left ?? 0) + 24,
          top: (selected.top ?? 0) + 24,
          id: this.id("copy"),
        });
        this.canvas?.add(copy);
        this.sync("Layer duplicated", true);
      });
  }
  removeSelected() {
    const selected = this.canvas?.getActiveObjects() ?? [];
    if (!selected.length) return;
    this.mutate(
      () => selected.forEach((x) => this.canvas?.remove(x)),
      "Layer deleted",
    );
    this.canvas?.discardActiveObject();
  }
  alignCenter() {
    const o = this.canvas?.getActiveObject();
    if (!o || !this.canvas) return;
    this.mutate(
      () => o.set({ left: this.canvas!.width / 2 - o.getScaledWidth() / 2 }),
      "Layer centered",
    );
  }
  group() {
    const active = this.canvas?.getActiveObject();
    if (!(active instanceof ActiveSelection) || !this.canvas) return;
    this.history.capture(this.serialize());
    const objects = active.removeAll();
    this.canvas.remove(active);
    const group = new Group(objects);
    group.set("id", this.id("group"));
    this.canvas.add(group);
    this.canvas.setActiveObject(group);
    this.sync("Layers grouped", true);
  }
  ungroup() {
    const active = this.canvas?.getActiveObject();
    if (!(active instanceof Group) || !this.canvas) return;
    this.history.capture(this.serialize());
    const objects = active.removeAll();
    this.canvas.remove(active);
    objects.forEach((o) => this.canvas?.add(o));
    this.canvas.setActiveObject(
      new ActiveSelection(objects, { canvas: this.canvas }),
    );
    this.sync("Group separated", true);
  }
  selectLayer(id: string) {
    const o = this.find(id);
    if (o && this.canvas) {
      this.canvas.setActiveObject(o);
      this.sync("Layer selected", false);
    }
  }
  toggleVisible(id: string) {
    const o = this.find(id);
    if (o)
      this.mutate(() => o.set({ visible: !o.visible }), "Visibility changed");
  }
  toggleLock(id: string) {
    const o = this.find(id);
    if (o)
      this.mutate(
        () => o.set({ selectable: !o.selectable, evented: !o.evented }),
        "Lock changed",
      );
  }
  setFontSize(size: number) {
    const o = this.canvas?.getActiveObject();
    if (o instanceof FabricText)
      this.mutate(() => o.set({ fontSize: size }), "Font size updated");
  }
  applyGradient(colors: readonly string[], radial = false) {
    const o = this.canvas?.getActiveObject();
    if (!o || colors.length < 2) return;
    this.mutate(
      () =>
        o.set(
          "fill",
          new Gradient({
            type: radial ? "radial" : "linear",
            coords: radial
              ? { x1: 0, y1: 0, r1: 0, x2: 0.5, y2: 0.5, r2: 1 }
              : { x1: 0, y1: 0, x2: 1, y2: 0 },
            gradientUnits: "percentage",
            colorStops: [
              { offset: 0, color: colors[0] },
              { offset: 1, color: colors[1] },
            ],
          }),
        ),
      "Gradient applied",
    );
  }
  cropSelected() {
    const image = this.canvas?.getActiveObject();
    if (!(image instanceof FabricImage)) return;
    this.mutate(() => {
      image.set({
        cropX: Math.max(
          0,
          (image.width - image.getScaledWidth() / image.scaleX) / 2,
        ),
        cropY: Math.max(
          0,
          (image.height - image.getScaledHeight() / image.scaleY) / 2,
        ),
      });
    }, "Image crop applied");
  }
  isImageSelected() {
    return this.canvas?.getActiveObject() instanceof FabricImage;
  }
  resize(width: number, height: number) {
    if (!this.canvas) return;
    this.canvas.setDimensions({ width, height });
    this.sync("Canvas resized", true);
  }
  setZoom(value: number) {
    this.zoom.set(value);
    this.canvas?.setZoom(value / 100);
    this.canvas?.requestRenderAll();
  }
  seed(template: FlyerTemplateView, title: string, details: string) {
    if (!this.canvas) return;
    this.history.capture(this.serialize());
    this.canvas.clear();
    this.canvas.backgroundColor = template.palette[0];
    const safeTitle = title.trim() || "Add your headline";
    this.canvas.add(
      new FabricText(safeTitle, {
        left: 55,
        top: 140,
        fontSize: 50,
        fontWeight: "bold",
        fill: template.palette[2],
        id: "headline",
      }),
      new FabricText(details, {
        left: 58,
        top: this.canvas.height - 150,
        fontSize: 18,
        fill: template.palette[2],
        id: "details",
      }),
      new Rect({
        left: 55,
        top: 100,
        width: 80,
        height: 8,
        fill: template.palette[1],
        id: "accent",
      }),
    );
    this.sync("Template applied", true);
  }
  applyBrandKit(brand: BrandKitView) {
    const colors = [...brand.primaryColors, ...brand.secondaryColors];
    if (colors.length >= 2) this.applyGradient(colors);
    if (brand.logo) void this.addImage(brand.logo);
  }
  undo() {
    const state = this.history.undo(this.serialize());
    if (state) void this.deserialize(state, true);
  }
  redo() {
    const state = this.history.redo(this.serialize());
    if (state) void this.deserialize(state, true);
  }
  private mutate(action: () => unknown, message: string) {
    if (!this.canvas) return;
    this.history.capture(this.serialize());
    action();
    this.sync(message, true);
  }
  private find(id: string) {
    return this.canvas?.getObjects().find((x) => String(x.get("id")) === id);
  }
  private id(prefix: string) {
    return `${prefix}-${++this.sequence}`;
  }
  private sync(message: string, dirty: boolean) {
    this.canvas?.requestRenderAll();
    const objects = this.canvas?.getObjects() ?? [];
    this.layers.set(
      objects.map((o, i) => ({
        id: String(o.get("id") ?? `layer-${i + 1}`),
        name: String(o.get("name") ?? o.get("id") ?? o.type),
        visible: o.visible,
        locked: !o.selectable,
        type: o.type,
      })),
    );
    const active = this.canvas?.getActiveObject();
    this.activeSelection.set(
      active
        ? (this.layers().find((x) => x.id === String(active.get("id"))) ?? null)
        : null,
    );
    if (dirty) this.dirty.set(true);
    if (dirty) this.changeVersion.update((value) => value + 1);
    this.announcement.set(message);
  }
}
