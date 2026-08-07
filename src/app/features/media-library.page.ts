import { NgClass } from "@angular/common";
import { Component, computed, signal } from "@angular/core";
import { FormControl, ReactiveFormsModule } from "@angular/forms";

type AssetType =
  | "Logo"
  | "People photo"
  | "Background"
  | "Design"
  | "Video"
  | "Audio"
  | "Document"
  | "Generated";
type UploadState = "queued" | "uploading" | "complete" | "failed" | "cancelled";
interface MediaAsset {
  readonly id: number;
  readonly name: string;
  readonly type: AssetType;
  readonly folder: string;
  readonly tags: readonly string[];
  readonly dimensions: string;
  readonly size: string;
  readonly owner: string;
  readonly uploadState: UploadState;
  readonly altText: string;
  readonly archived: boolean;
  readonly references: readonly string[];
}
const TYPES: readonly AssetType[] = [
  "Logo",
  "People photo",
  "Background",
  "Design",
  "Video",
  "Audio",
  "Document",
  "Generated",
];

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, NgClass],
  styles: [
    `
      .head,
      .toolbar,
      .asset-head,
      .meta,
      .actions {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .toolbar {
        flex-wrap: wrap;
      }
      .library {
        grid-template-columns: 260px 1fr;
      }
      .gridview {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
        gap: 1rem;
      }
      .listview {
        display: grid;
        gap: 0.75rem;
      }
      .asset {
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 1rem;
        background: white;
      }
      .thumb {
        height: 120px;
        border-radius: 14px;
        background: linear-gradient(135deg, #f5f0ff, #e8fbff);
        display: grid;
        place-items: center;
        color: var(--primary);
        font-weight: 800;
      }
      .meta {
        align-items: start;
        flex-wrap: wrap;
      }
      .filters {
        display: grid;
        gap: 0.75rem;
      }
      .selected {
        outline: 3px solid var(--primary);
      }
      .archived {
        opacity: 0.6;
      }
      .danger {
        border-color: #fecaca;
        background: #fff7f7;
      }
      .progress {
        width: 100%;
      }
      @media (max-width: 900px) {
        .library {
          grid-template-columns: 1fr;
        }
        .head {
          align-items: start;
          flex-direction: column;
        }
      }
    `,
  ],
  template: ` <header class="head">
      <div>
        <p class="eyebrow">Media library</p>
        <h1>Searchable ministry assets</h1>
        <p class="muted">
          Manage folders, tags, uploads, metadata, usage references,
          archive/restore, and destructive-change impact.
        </p>
      </div>
      <label class="btn"
        >Upload assets<input
          type="file"
          multiple
          hidden
          (change)="upload($event)"
      /></label>
    </header>
    <section class="card toolbar">
      <label
        >Search
        <input
          [formControl]="search"
          placeholder="logo, pastor, sermon" /></label
      ><label
        >View
        <select [formControl]="view">
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select></label
      ><span class="badge info">{{ filtered().length }} assets</span
      ><span class="badge secondary">{{ selectedIds().length }} selected</span>
    </section>
    <div class="grid library">
      <aside class="card filters">
        <h2>Folders, tags, filters</h2>
        <label
          >Folder
          <select [formControl]="folder">
            <option value="">All folders</option>
            <option>Brand</option>
            <option>People</option>
            <option>Campaigns</option>
            <option>Audio</option>
            <option>Documents</option>
          </select></label
        ><label
          >Type
          <select [formControl]="type">
            <option value="">All types</option>
            @for (item of types; track item) {
              <option [value]="item">{{ item }}</option>
            }
          </select></label
        ><label>Tag <input [formControl]="tag" placeholder="revival" /></label>
        <div class="actions">
          <button class="btn secondary" (click)="renameSelected()">
            Rename</button
          ><button class="btn secondary" (click)="archiveSelected()">
            Archive</button
          ><button class="btn secondary" (click)="restoreSelected()">
            Restore</button
          ><button class="btn" (click)="deleteSelected()">Delete</button>
        </div>
        <div class="danger asset" aria-live="polite">
          <b>Usage impact</b>
          <p>{{ impactMessage() }}</p>
        </div>
      </aside>
      <main
        [ngClass]="view.value === 'grid' ? 'gridview' : 'listview'"
        aria-label="Media assets"
      >
        @for (asset of filtered(); track asset.id) {
          <article
            class="asset"
            [class.selected]="isSelected(asset.id)"
            [class.archived]="asset.archived"
          >
            <div class="asset-head">
              <label
                ><input
                  type="checkbox"
                  [checked]="isSelected(asset.id)"
                  (change)="toggle(asset.id)"
                />
                {{ asset.name }}</label
              ><span class="badge" [ngClass]="asset.uploadState">{{
                asset.uploadState
              }}</span>
            </div>
            <div class="thumb">{{ asset.type }}</div>
            <div class="meta">
              <small>{{ asset.dimensions }} · {{ asset.size }}</small
              ><small>{{ asset.owner }}</small
              ><small>{{ asset.folder }}</small>
            </div>
            <p>{{ asset.altText }}</p>
            <div class="actions">
              @for (tag of asset.tags; track tag) {
                <span class="badge secondary">{{ tag }}</span>
              }
            </div>
            @if (asset.references.length) {
              <p class="muted">Used in: {{ asset.references.join(", ") }}</p>
            }
            <progress
              class="progress"
              [value]="asset.uploadState === 'complete' ? 100 : 40"
              max="100"
            ></progress>
          </article>
        } @empty {
          <section class="empty">
            <h2>No assets found</h2>
            <p>Try another search, filter, folder, or upload a new file.</p>
          </section>
        }
      </main>
    </div>`,
})
export class MediaLibraryPage {
  readonly types = TYPES;
  readonly search = new FormControl("", { nonNullable: true });
  readonly folder = new FormControl("", { nonNullable: true });
  readonly type = new FormControl<AssetType | "">("", { nonNullable: true });
  readonly tag = new FormControl("", { nonNullable: true });
  readonly view = new FormControl<"grid" | "list">("grid", {
    nonNullable: true,
  });
  readonly selectedIds = signal<readonly number[]>([]);
  readonly assets = signal<readonly MediaAsset[]>([
    {
      id: 1,
      name: "Primary church logo",
      type: "Logo",
      folder: "Brand",
      tags: ["logo", "approved"],
      dimensions: "1600×900",
      size: "420 KB",
      owner: "Media Team",
      uploadState: "complete",
      altText: "Sanctuary logo in purple and gold",
      archived: false,
      references: ["August flyer", "Welcome video"],
    },
    {
      id: 2,
      name: "Pastor portrait",
      type: "People photo",
      folder: "People",
      tags: ["pastor"],
      dimensions: "2400×3000",
      size: "2.1 MB",
      owner: "Admin",
      uploadState: "complete",
      altText: "Senior pastor portrait",
      archived: false,
      references: [],
    },
    {
      id: 3,
      name: "Declaration voice over",
      type: "Audio",
      folder: "Audio",
      tags: ["declaration"],
      dimensions: "Stereo MP3",
      size: "8 MB",
      owner: "Worship",
      uploadState: "complete",
      altText: "Audio narration for declaration video",
      archived: false,
      references: ["Declaration video"],
    },
  ]);
  readonly filtered = computed(() =>
    this.assets().filter((a) =>
      matches(
        a,
        this.search.value,
        this.folder.value,
        this.type.value,
        this.tag.value,
      ),
    ),
  );
  readonly impactMessage = computed(() => {
    const refs = this.assets()
      .filter((a) => this.selectedIds().includes(a.id))
      .flatMap((a) => a.references);
    return refs.length
      ? `Destructive changes are blocked until you review references: ${refs.join(", ")}.`
      : "No selected in-use references; archive is still safer than delete.";
  });
  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }
  toggle(id: number): void {
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id],
    );
  }
  upload(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    this.assets.update((items) => [
      ...files.map((file, index) => ({
        id: Date.now() + index,
        name: file.name,
        type: inferType(file),
        folder: "Uploads",
        tags: ["new"],
        dimensions: file.type || "unknown",
        size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        owner: "Local prototype upload",
        uploadState: "complete" as const,
        altText: `Uploaded asset ${file.name}`,
        archived: false,
        references: [],
      })),
      ...items,
    ]);
  }
  renameSelected(): void {
    this.assets.update((items) =>
      items.map((a) =>
        this.isSelected(a.id) ? { ...a, name: `${a.name} (renamed)` } : a,
      ),
    );
  }
  archiveSelected(): void {
    this.assets.update((items) =>
      items.map((a) => (this.isSelected(a.id) ? { ...a, archived: true } : a)),
    );
  }
  restoreSelected(): void {
    this.assets.update((items) =>
      items.map((a) => (this.isSelected(a.id) ? { ...a, archived: false } : a)),
    );
  }
  deleteSelected(): void {
    const blocked = this.assets()
      .filter((a) => this.isSelected(a.id) && a.references.length > 0)
      .map((a) => a.id);
    this.assets.update((items) =>
      items.filter((a) => !this.isSelected(a.id) || blocked.includes(a.id)),
    );
    this.selectedIds.set(blocked);
  }
}
function matches(
  asset: MediaAsset,
  search: string,
  folder: string,
  type: AssetType | "",
  tag: string,
): boolean {
  const q = search.toLowerCase();
  return (
    (!q ||
      `${asset.name} ${asset.type} ${asset.altText}`
        .toLowerCase()
        .includes(q)) &&
    (!folder || asset.folder === folder) &&
    (!type || asset.type === type) &&
    (!tag || asset.tags.some((t) => t.includes(tag.toLowerCase())))
  );
}
function inferType(file: File): AssetType {
  if (file.type.startsWith("video/")) return "Video";
  if (file.type.startsWith("audio/")) return "Audio";
  if (file.type.includes("pdf") || file.type.includes("document"))
    return "Document";
  if (file.type.startsWith("image/")) return "Generated";
  return "Document";
}
