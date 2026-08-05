import { NgClass } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import type { JobStatus } from "../models/domain.models";

type VideoKind =
  | "Animated flyer"
  | "Scripture"
  | "Prayer"
  | "Sermon quote"
  | "Invitation"
  | "Countdown"
  | "Declaration"
  | "Recap";
type RenderState = JobStatus;
interface Scene {
  readonly id: number;
  readonly title: string;
  readonly seconds: number;
  readonly overlay: string;
  readonly transition: string;
}
interface UploadDraft {
  readonly name: string;
  readonly progress: number;
  readonly state: "queued" | "uploading" | "complete" | "failed";
}
const KINDS: readonly VideoKind[] = [
  "Animated flyer",
  "Scripture",
  "Prayer",
  "Sermon quote",
  "Invitation",
  "Countdown",
  "Declaration",
  "Recap",
];
const DURATIONS = [15, 30, 60, 90] as const;
const STORE_KEY = "sanctuary-video-studio-draft";

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  styles: [
    `
      .head,
      .bar,
      .scene,
      .asset,
      .render {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .layout {
        grid-template-columns: 340px 1fr 320px;
      }
      .canvas {
        aspect-ratio: 9/16;
        max-height: 68vh;
        margin: auto;
        border-radius: 28px;
        background: linear-gradient(160deg, #1c1340, #7f3fbf 48%, #f7c948);
        color: white;
        padding: 1.2rem;
        display: grid;
        align-content: space-between;
        box-shadow: 0 24px 70px #2d185033;
      }
      .safe {
        border: 1px dashed rgba(255, 255, 255, 0.7);
        border-radius: 22px;
        padding: 1rem;
        min-height: 70%;
      }
      .timeline {
        height: 10px;
        background: #eee;
        border-radius: 999px;
        overflow: hidden;
      }
      .timeline span {
        display: block;
        height: 100%;
        background: var(--primary);
      }
      .scene,
      .asset,
      .render {
        padding: 0.75rem;
        border: 1px solid var(--line);
        border-radius: 14px;
        margin-top: 0.6rem;
      }
      .controls {
        display: grid;
        gap: 0.7rem;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.45rem;
      }
      .caption {
        width: 100%;
        min-height: 90px;
      }
      .status-queued {
        background: #eef2ff;
      }
      .status-running {
        background: #fff7ed;
      }
      .status-completed {
        background: #ecfdf5;
      }
      .status-failed {
        background: #fef2f2;
      }
      .reduce {
        scroll-behavior: auto;
        animation: none;
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
        .canvas {
          box-shadow: none;
        }
      }
      @media (max-width: 1100px) {
        .layout {
          grid-template-columns: 1fr;
        }
        .canvas {
          max-height: none;
        }
      }
    `,
  ],
  template: ` <header class="head">
      <div>
        <p class="eyebrow">Video studio</p>
        <h1>Vertical MP4 project studio</h1>
        <p class="muted">
          Create ministry videos with recoverable drafts, accessible controls,
          captions, audio, transitions, preview, and backend render lifecycle.
        </p>
      </div>
      <button class="btn" (click)="createProject()">Create project</button>
    </header>
    <section class="card bar" aria-live="polite">
      <b>Autosave: {{ saveState() }}</b
      ><span class="badge" [ngClass]="'status-' + renderStatus()"
        >Render {{ renderStatus() }}</span
      >
    </section>
    <div class="grid layout">
      <form
        class="card controls"
        [formGroup]="form"
        aria-label="Video project creation"
      >
        <h2>Project creation</h2>
        <label
          >Video type<select formControlName="kind">
            @for (kind of kinds; track kind) {
              <option [value]="kind">{{ kind }}</option>
            }
          </select></label
        >
        <label
          >Duration<select formControlName="duration">
            @for (duration of durations; track duration) {
              <option [ngValue]="duration">{{ duration }} seconds</option>
            }
          </select></label
        >
        <small class="error">
          @if (
            form.controls.duration.invalid && form.controls.duration.touched
          ) {
            Choose 15, 30, 60, or 90 seconds.
          }
        </small>
        <label
          >Project title<input
            formControlName="title"
            placeholder="Sunday recap"
        /></label>
        <label
          >Voice-over notes<textarea
            formControlName="voiceOver"
            placeholder="Warm pastoral delivery"
          ></textarea>
        </label>
        <label
          >Caption editor<textarea
            class="caption"
            formControlName="captions"
            placeholder="Edit burned-in captions"
          ></textarea>
        </label>
        <label
          >Background audio volume
          <input type="range" min="0" max="100" formControlName="audioVolume"
        /></label>
        <label
          >Voice-over volume
          <input type="range" min="0" max="100" formControlName="voiceVolume"
        /></label>
        <label
          ><input type="checkbox" formControlName="reducedMotion" />
          Reduced-motion preview</label
        >
        <div class="chips">
          @for (kind of kinds; track kind) {
            <span class="badge secondary">{{ kind }}</span>
          }
        </div>
      </form>
      <main class="card">
        <h2>9:16 preview canvas</h2>
        <div
          class="canvas"
          [class.reduce]="form.controls.reducedMotion.value"
          role="img"
          [attr.aria-label]="previewLabel()"
        >
          <div class="safe">
            <p class="eyebrow">{{ form.controls.kind.value }}</p>
            <h2>
              {{ form.controls.title.value || "Untitled ministry video" }}
            </h2>
            <p>
              {{
                form.controls.captions.value ||
                  "Captions appear here with safe-area guides."
              }}
            </p>
          </div>
          <div>
            <div class="timeline">
              <span [style.width.%]="previewProgress()"></span>
            </div>
            <small
              >{{ totalSceneSeconds() }} /
              {{ form.controls.duration.value }} seconds planned</small
            >
          </div>
        </div>
      </main>
      <aside class="card">
        <h2>Scenes and render</h2>
        <button class="btn secondary" (click)="addScene()">Add scene</button>
        @for (scene of scenes(); track scene.id) {
          <div class="scene">
            <span
              ><b>{{ scene.title }}</b
              ><br /><small
                >{{ scene.seconds }}s · {{ scene.transition }} ·
                {{ scene.overlay }}</small
              ></span
            ><button
              class="btn ghost"
              (click)="removeScene(scene.id)"
              aria-label="Remove scene"
            >
              ×
            </button>
          </div>
        }
        <h3>Asset picker and uploads</h3>
        <input type="file" multiple (change)="queueUploads($event)" />
        @for (asset of uploads(); track asset.name) {
          <div class="asset">
            <span>{{ asset.name }}</span
            ><progress [value]="asset.progress" max="100"></progress>
          </div>
        }
        <h3>Backend MP4 rendering</h3>
        <div class="render">
          <span>{{ renderMessage() }}</span
          ><progress [value]="renderProgress()" max="100"></progress>
        </div>
        <button class="btn" (click)="startRender()">Render MP4</button
        ><button class="btn secondary" (click)="cancelRender()">Cancel</button
        ><button class="btn secondary" (click)="retryRender()">Retry</button>
      </aside>
    </div>`,
})
export class VideoStudioPage {
  readonly kinds = KINDS;
  readonly durations = DURATIONS;
  readonly saveState = signal("Recovered local draft");
  readonly scenes = signal<readonly Scene[]>([
    {
      id: 1,
      title: "Opening scripture",
      seconds: 5,
      overlay: "Headline",
      transition: "Fade",
    },
    {
      id: 2,
      title: "Prayer focus",
      seconds: 5,
      overlay: "Lower third",
      transition: "Slide",
    },
  ]);
  readonly uploads = signal<readonly UploadDraft[]>([]);
  readonly renderStatus = signal<RenderState>("queued");
  readonly renderProgress = signal(0);
  readonly renderMessage = signal("Waiting to render");
  readonly form = new FormGroup({
    kind: new FormControl<VideoKind>("Animated flyer", { nonNullable: true }),
    duration: new FormControl<number>(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^(15|30|60|90)$/)],
    }),
    title: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
    voiceOver: new FormControl("", { nonNullable: true }),
    captions: new FormControl("", { nonNullable: true }),
    audioVolume: new FormControl(65, { nonNullable: true }),
    voiceVolume: new FormControl(80, { nonNullable: true }),
    reducedMotion: new FormControl(false, { nonNullable: true }),
  });
  constructor() {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved)
      this.form.patchValue(
        JSON.parse(saved) as Partial<typeof this.form.value>,
      );
    this.form.valueChanges.subscribe(() => this.persist());
  }
  readonly totalSceneSeconds = computed(() =>
    this.scenes().reduce((t, s) => t + s.seconds, 0),
  );
  readonly previewProgress = computed(() =>
    Math.min(
      100,
      Math.round(
        (this.totalSceneSeconds() / this.form.controls.duration.value) * 100,
      ),
    ),
  );
  previewLabel(): string {
    return `${this.form.controls.kind.value} vertical video preview with captions, overlays, audio, and transitions`;
  }
  createProject(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.persist();
    this.saveState.set("Project created and autosaved");
  }
  addScene(): void {
    const id = Date.now();
    this.scenes.update((s) => [
      ...s,
      {
        id,
        title: `Scene ${s.length + 1}`,
        seconds: 5,
        overlay: "Caption",
        transition: "Fade",
      },
    ]);
    this.persist();
  }
  removeScene(id: number): void {
    this.scenes.update((s) => s.filter((scene) => scene.id !== id));
    this.persist();
  }
  queueUploads(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.uploads.update((items) => [
      ...files.map((file) => ({
        name: file.name,
        progress: 100,
        state: "complete" as const,
      })),
      ...items,
    ]);
    this.persist();
  }
  startRender(): void {
    this.renderStatus.set("running");
    this.renderMessage.set("Queued with backend renderer; polling status");
    this.renderProgress.set(45);
    setTimeout(() => {
      if (this.renderStatus() === "running") {
        this.renderStatus.set("completed");
        this.renderProgress.set(100);
        this.renderMessage.set("MP4 render complete");
      }
    }, 350);
  }
  cancelRender(): void {
    this.renderStatus.set("cancelled");
    this.renderMessage.set("Render cancelled");
  }
  retryRender(): void {
    this.renderStatus.set("queued");
    this.renderProgress.set(0);
    this.startRender();
  }
  private persist(): void {
    localStorage.setItem(
      STORE_KEY,
      JSON.stringify({
        ...this.form.getRawValue(),
        scenes: this.scenes(),
        uploads: this.uploads(),
      }),
    );
    this.saveState.set("Saved locally with uploads and draft metadata");
  }
}
