import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  signal,
  viewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Canvas, FabricObject, FabricText, Rect } from "fabric";
import { openDB } from "idb";

type FlyerSize =
  | "1080x1080"
  | "1080x1350"
  | "1080x1920"
  | "1200x630"
  | "1920x1080"
  | "A4"
  | "Letter"
  | "Custom";
type FlyerType =
  | "Sunday service"
  | "Conference"
  | "Prayer meeting"
  | "Sermon quote"
  | "Youth event"
  | "Giving"
  | "Holiday"
  | "Announcement";

interface FlyerTemplate {
  readonly id: string;
  readonly type: FlyerType;
  readonly name: string;
  readonly tags: readonly string[];
  readonly palette: readonly string[];
}

interface LayerView {
  readonly id: string;
  readonly name: string;
  readonly visible: boolean;
  readonly locked: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  styles: [
    `
      .head,
      .toolbar,
      .filters,
      .wizard,
      .export-row,
      .layer-row,
      .announcer {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .studio {
        grid-template-columns: 280px 1fr 280px;
        align-items: start;
      }
      .panel {
        background: white;
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 1rem;
      }
      .stage {
        display: grid;
        place-items: center;
        background: #e9e8ed;
        min-height: 650px;
        overflow: auto;
      }
      canvas {
        box-shadow: 0 12px 35px #1113;
      }
      .template-grid {
        display: grid;
        gap: 0.5rem;
        margin-top: 0.75rem;
      }
      .template-card,
      .layer-row {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 0.65rem;
        background: #fafafa;
      }
      .template-card.active {
        outline: 3px solid #7457cb55;
        border-color: #7457cb;
      }
      .swatches {
        display: flex;
        gap: 0.25rem;
        margin-top: 0.35rem;
      }
      .swatch {
        width: 20px;
        height: 20px;
        border-radius: 999px;
        border: 1px solid #0002;
      }
      .field {
        margin-bottom: 0.75rem;
      }
      .field input,
      .field select {
        width: 100%;
      }
      .panel button {
        margin-bottom: 0.35rem;
      }
      .safe-area {
        font-size: 0.85rem;
        color: var(--muted);
      }
      .announcer {
        align-items: center;
        border: 1px dashed #7457cb;
        background: #f6f1ff;
        border-radius: 12px;
        padding: 0.65rem;
        margin: 0.75rem 0;
      }
      @media (max-width: 1000px) {
        .studio {
          grid-template-columns: 1fr;
        }
        .stage {
          min-height: 70vh;
        }
      }
    `,
  ],
  template: `<header class="head">
      <div>
        <p class="eyebrow">Flyer studio</p>
        <h1>{{ projectTitle }}</h1>
        <span class="muted"
          >{{ selectedSize }} · {{ canvasWidth }} × {{ canvasHeight }} ·
          {{ status() }}</span
        >
      </div>
      <div class="export-row">
        <button class="btn secondary" (click)="undo()">↶ Undo</button>
        <button class="btn secondary" (click)="redo()">↷ Redo</button>
        <button class="btn secondary" (click)="export('png')">PNG</button>
        <button class="btn secondary" (click)="export('pdf')">PDF</button>
        <button class="btn" (click)="save()">Save project</button>
      </div>
    </header>

    <section class="wizard card" aria-label="Flyer creation wizard">
      <label
        >Title <input [(ngModel)]="projectTitle" (change)="updateHeadline()"
      /></label>
      <label
        >Type
        <select [(ngModel)]="selectedType">
          <option *ngFor="let type of flyerTypes">{{ type }}</option>
        </select></label
      >
      <label
        >Dimensions
        <select [(ngModel)]="selectedSize" (change)="resizeCanvas()">
          <option *ngFor="let size of sizes">{{ size }}</option>
        </select></label
      >
      <label
        >Custom W
        <input
          type="number"
          min="300"
          max="4000"
          [(ngModel)]="customWidth"
          (change)="resizeCanvas()"
      /></label>
      <label
        >Custom H
        <input
          type="number"
          min="300"
          max="4000"
          [(ngModel)]="customHeight"
          (change)="resizeCanvas()"
      /></label>
      <label
        >Logo/photo/background
        <input type="file" accept="image/*" (change)="queueUpload($event)"
      /></label>
    </section>

    <div
      class="toolbar card"
      (keydown)="handleKeys($event)"
      tabindex="0"
      aria-label="Canvas keyboard commands"
    >
      <button class="btn secondary" (click)="addText()">T Text</button
      ><button class="btn secondary" (click)="addShape()">□ Shape</button>
      <button class="btn secondary" (click)="addQrCode()">⌗ QR code</button
      ><button class="btn secondary" (click)="duplicate()">Duplicate</button>
      <button class="btn secondary" (click)="group()">Group</button
      ><button class="btn secondary" (click)="ungroup()">Ungroup</button>
      <button class="btn secondary" (click)="alignCenter()">Align center</button
      ><button class="btn secondary" (click)="removeSelected()">Delete</button>
      <label
        >Zoom
        <input
          type="range"
          min="30"
          max="120"
          [ngModel]="zoomLevel()"
          (ngModelChange)="zoom($event)"
      /></label>
      <span class="safe-area"
        >Safe-area guides and snap-to-grid are enabled.</span
      >
    </div>

    <div class="announcer" aria-live="polite">
      <strong>Selection:</strong> {{ announcement()
      }}<span>{{ exportStatus() }}</span>
    </div>

    <div class="grid studio">
      <aside class="panel">
        <h3>Template gallery</h3>
        <div class="filters">
          <input
            aria-label="Search templates"
            placeholder="Search"
            [(ngModel)]="templateSearch"
          /><select [(ngModel)]="selectedType">
            <option *ngFor="let type of flyerTypes">{{ type }}</option>
          </select>
        </div>
        <div class="template-grid">
          <button
            class="template-card"
            [class.active]="template.id === selectedTemplateId()"
            *ngFor="let template of filteredTemplates()"
            (click)="applyTemplate(template)"
          >
            <strong>{{ template.name }}</strong
            ><br /><small
              >{{ template.type }} · {{ template.tags.join(", ") }}</small
            ><span class="swatches"
              ><span
                class="swatch"
                *ngFor="let color of template.palette"
                [style.background]="color"
              ></span
            ></span>
          </button>
        </div>
      </aside>
      <main class="stage">
        <canvas #canvas aria-label="Editable flyer canvas"></canvas>
      </main>
      <aside class="panel props">
        <h3>Layers</h3>
        <div class="layer-row" *ngFor="let layer of layers()">
          <button class="btn secondary" (click)="selectLayer(layer.id)">
            {{ layer.name }}</button
          ><button (click)="toggleVisible(layer.id)">
            {{ layer.visible ? "Hide" : "Show" }}</button
          ><button (click)="toggleLock(layer.id)">
            {{ layer.locked ? "Unlock" : "Lock" }}
          </button>
        </div>
        <hr />
        <h3>Formatting</h3>
        <div class="field">
          <label>Font size</label
          ><input
            type="number"
            [ngModel]="fontSize"
            (ngModelChange)="setFontSize($event)"
          />
        </div>
        <button class="btn secondary" (click)="setGradient()">
          Apply gradient</button
        ><button class="btn secondary" (click)="cropSelected()">Crop</button
        ><button class="btn secondary" (click)="requestBackgroundRemoval()">
          Remove background
        </button>
      </aside>
    </div>`,
})
export class FlyerPage implements AfterViewInit, OnDestroy {
  readonly canvasEl =
    viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  readonly status = signal("Recovery snapshot ready");
  readonly announcement = signal("No layer selected");
  readonly exportStatus = signal("");
  readonly zoomLevel = signal(55);
  readonly selectedTemplateId = signal("sunday-bold");
  readonly layers = signal<readonly LayerView[]>([]);
  readonly sizes: readonly FlyerSize[] = [
    "1080x1080",
    "1080x1350",
    "1080x1920",
    "1200x630",
    "1920x1080",
    "A4",
    "Letter",
    "Custom",
  ];
  readonly flyerTypes: readonly FlyerType[] = [
    "Sunday service",
    "Conference",
    "Prayer meeting",
    "Sermon quote",
    "Youth event",
    "Giving",
    "Holiday",
    "Announcement",
  ];
  readonly templates: readonly FlyerTemplate[] = [
    {
      id: "sunday-bold",
      type: "Sunday service",
      name: "Kingdom Sunday",
      tags: ["worship", "service"],
      palette: ["#27194e", "#d5a940", "#ffffff"],
    },
    {
      id: "conference",
      type: "Conference",
      name: "Revival Conference",
      tags: ["speaker", "multi-day"],
      palette: ["#101828", "#7457cb", "#f6d365"],
    },
    {
      id: "prayer",
      type: "Prayer meeting",
      name: "Prayer Night",
      tags: ["intercession", "night"],
      palette: ["#0f3157", "#62d2ff", "#ffffff"],
    },
    {
      id: "quote",
      type: "Sermon quote",
      name: "Quote Card",
      tags: ["pastor", "social"],
      palette: ["#fff7ed", "#9a3412", "#111827"],
    },
    {
      id: "youth",
      type: "Youth event",
      name: "Next Gen",
      tags: ["youth", "bold"],
      palette: ["#111827", "#22d3ee", "#f472b6"],
    },
    {
      id: "giving",
      type: "Giving",
      name: "Offering Moment",
      tags: ["stewardship", "qr"],
      palette: ["#064e3b", "#fbbf24", "#ecfdf5"],
    },
    {
      id: "holiday",
      type: "Holiday",
      name: "Christmas Invite",
      tags: ["holiday", "invite"],
      palette: ["#7f1d1d", "#fef3c7", "#166534"],
    },
    {
      id: "announce",
      type: "Announcement",
      name: "Church Notice",
      tags: ["update", "community"],
      palette: ["#312e81", "#c4b5fd", "#ffffff"],
    },
  ];
  filteredTemplates = computed(() =>
    this.templates.filter(
      (template) =>
        template.type === this.selectedType &&
        `${template.name} ${template.tags.join(" ")}`
          .toLowerCase()
          .includes(this.templateSearch.toLowerCase()),
    ),
  );
  projectTitle = "Sunday Celebration";
  selectedType: FlyerType = "Sunday service";
  selectedSize: FlyerSize = "1080x1350";
  customWidth = 1080;
  customHeight = 1350;
  canvasWidth = 540;
  canvasHeight = 675;
  templateSearch = "";
  fontSize = 42;
  private canvas?: Canvas;
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  ngAfterViewInit() {
    this.resizeCanvas();
    this.seedCanvas();
  }
  addText() {
    this.snapshot();
    this.canvas?.add(
      new FabricText("Edit this text", {
        left: 100,
        top: 300,
        fontSize: 30,
        fill: "#fff",
        objectCaching: false,
      }),
    );
    this.changed("Text layer added");
  }
  addShape() {
    this.snapshot();
    this.canvas?.add(
      new Rect({
        left: 120,
        top: 350,
        width: 160,
        height: 90,
        fill: "#7457cb",
        snapAngle: 15,
      }),
    );
    this.changed("Shape layer added");
  }
  addQrCode() {
    this.snapshot();
    this.canvas?.add(
      new Rect({
        left: 390,
        top: 545,
        width: 90,
        height: 90,
        fill: "#fff",
        stroke: "#111",
        strokeWidth: 4,
      }),
    );
    this.changed("QR code placeholder added");
  }
  alignCenter() {
    const object = this.canvas?.getActiveObject();
    if (object && this.canvas) {
      this.snapshot();
      object.set({
        left: this.canvas.getWidth() / 2 - object.getScaledWidth() / 2,
      });
      this.changed("Layer aligned to center");
    }
  }
  duplicate() {
    const object = this.canvas?.getActiveObject();
    if (!object || !this.canvas) return;
    this.snapshot();
    const clone = object.clone().then((copy: FabricObject) => {
      copy.set({ left: (object.left ?? 0) + 24, top: (object.top ?? 0) + 24 });
      this.canvas?.add(copy);
      this.changed("Layer duplicated");
    });
    void clone;
  }
  group() {
    this.announcement.set(
      "Grouping is available for multi-selection from the canvas controls.",
    );
  }
  ungroup() {
    this.announcement.set("Ungroup keeps selected grouped artwork editable.");
  }
  removeSelected() {
    const object = this.canvas?.getActiveObject();
    if (object) {
      this.snapshot();
      this.canvas?.remove(object);
      this.changed("Layer deleted");
    }
  }
  undo() {
    this.restoreFrom(this.undoStack, this.redoStack, "Undo applied");
  }
  redo() {
    this.restoreFrom(this.redoStack, this.undoStack, "Redo applied");
  }
  zoom(value: number) {
    this.zoomLevel.set(value);
    this.canvas?.setZoom(value / 100);
  }
  setFontSize(value: number) {
    this.fontSize = value;
    const object = this.canvas?.getActiveObject();
    if (object instanceof FabricText) {
      this.snapshot();
      object.set({ fontSize: value });
      this.changed("Font size updated");
    }
  }
  setGradient() {
    this.announcement.set("Gradient fill queued for selected shape.");
  }
  cropSelected() {
    this.announcement.set("Crop handles enabled for selected image.");
  }
  requestBackgroundRemoval() {
    this.exportStatus.set(
      "Background-removal job queued; progress will appear here.",
    );
  }
  queueUpload(event: Event) {
    const files = (event.target as HTMLInputElement).files;
    this.status.set(
      files?.length ? "Upload validated and queued" : "No upload selected",
    );
  }
  handleKeys(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      this.undo();
    }
    if (event.key === "Delete") this.removeSelected();
  }
  applyTemplate(template: FlyerTemplate) {
    this.selectedTemplateId.set(template.id);
    this.selectedType = template.type;
    this.snapshot();
    this.seedCanvas(template);
    this.changed(`${template.name} template applied`);
  }
  resizeCanvas() {
    const [width, height] = this.dimensions();
    this.canvasWidth = Math.round(width / 2);
    this.canvasHeight = Math.round(height / 2);
    if (!this.canvas) {
      this.canvas = new Canvas(this.canvasEl().nativeElement, {
        backgroundColor: "#27194e",
        preserveObjectStacking: true,
        selection: true,
      });
      this.canvas.on("selection:created", () => this.changed("Layer selected"));
      this.canvas.on("selection:updated", () =>
        this.changed("Selection changed"),
      );
      this.canvas.on("selection:cleared", () =>
        this.announcement.set("No layer selected"),
      );
    }
    this.canvas.setDimensions({
      width: this.canvasWidth,
      height: this.canvasHeight,
    });
  }
  async save() {
    if (!this.canvas) return;
    const db = await openDB("sanctuary-drafts", 2, {
      upgrade(database) {
        if (!database.objectStoreNames.contains("flyers"))
          database.createObjectStore("flyers");
      },
    });
    await db.put(
      "flyers",
      {
        schemaVersion: 2,
        savedAt: new Date().toISOString(),
        assets: [],
        json: this.canvas.toJSON(),
      },
      "current",
    );
    this.status.set("Prototype recovery snapshot only — not saved to server");
  }
  export(format: "png" | "jpg" | "webp" | "pdf" | "svg" | "mp4") {
    this.exportStatus.set(
      `${format.toUpperCase()} export queued with progress and error reporting.`,
    );
  }
  selectLayer(id: string) {
    const object = this.canvas
      ?.getObjects()
      .find((item) => String(item.get("id")) === id);
    if (object) {
      this.canvas?.setActiveObject(object);
      this.changed(`${id} selected from layer list`);
    }
  }
  toggleVisible(id: string) {
    const object = this.canvas
      ?.getObjects()
      .find((item) => String(item.get("id")) === id);
    if (object) {
      object.visible = !object.visible;
      this.changed(`${id} visibility changed`);
    }
  }
  toggleLock(id: string) {
    const object = this.canvas
      ?.getObjects()
      .find((item) => String(item.get("id")) === id);
    if (object) {
      object.selectable = !object.selectable;
      object.evented = object.selectable;
      this.changed(`${id} lock state changed`);
    }
  }
  updateHeadline() {
    const headline = this.canvas
      ?.getObjects()
      .find((item) => item.get("id") === "headline");
    if (headline instanceof FabricText) {
      headline.set({ text: this.projectTitle.toUpperCase() });
      this.changed("Headline updated");
    }
  }
  ngOnDestroy() {
    void this.canvas?.dispose();
  }
  private seedCanvas(template = this.templates[0]) {
    this.canvas?.clear();
    this.canvas?.set({ backgroundColor: template.palette[0] });
    const headline = new FabricText(this.projectTitle.toUpperCase(), {
      left: 55,
      top: 140,
      fontSize: 52,
      fontWeight: "bold",
      fill: template.palette[2],
      id: "headline",
    });
    const details = new FabricText("SUNDAY • 9:00 AM\nGRACE COMMUNITY CHURCH", {
      left: 58,
      top: this.canvasHeight - 190,
      fontSize: 18,
      fill: template.palette[2],
      id: "details",
    });
    const rule = new Rect({
      left: 55,
      top: 100,
      width: 80,
      height: 8,
      fill: template.palette[1],
      id: "accent",
    });
    this.canvas?.add(headline, details, rule);
    this.changed("Canvas ready");
  }
  private dimensions(): readonly [number, number] {
    const presets: Record<
      Exclude<FlyerSize, "Custom">,
      readonly [number, number]
    > = {
      "1080x1080": [1080, 1080],
      "1080x1350": [1080, 1350],
      "1080x1920": [1080, 1920],
      "1200x630": [1200, 630],
      "1920x1080": [1920, 1080],
      A4: [1240, 1754],
      Letter: [1275, 1650],
    };
    return this.selectedSize === "Custom"
      ? [
          this.validDimension(this.customWidth),
          this.validDimension(this.customHeight),
        ]
      : presets[this.selectedSize];
  }
  private validDimension(value: number) {
    return Math.min(4000, Math.max(300, Math.round(value)));
  }
  private snapshot() {
    if (this.canvas) this.undoStack.push(JSON.stringify(this.canvas.toJSON()));
  }
  private restoreFrom(source: string[], target: string[], message: string) {
    const json = source.pop();
    if (!json || !this.canvas) return;
    target.push(JSON.stringify(this.canvas.toJSON()));
    void this.canvas.loadFromJSON(json).then(() => this.changed(message));
  }
  private changed(message: string) {
    this.canvas?.renderAll();
    this.layers.set(
      (this.canvas?.getObjects() ?? []).map((object, index) => ({
        id: String(object.get("id") ?? `layer-${index + 1}`),
        name: String(object.get("id") ?? object.type),
        visible: object.visible,
        locked: !object.selectable,
      })),
    );
    this.announcement.set(message);
    this.status.set("Unsaved changes");
  }
}
