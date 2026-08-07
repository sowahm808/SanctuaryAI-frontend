import { CommonModule } from "@angular/common";
import { Component, input, output } from "@angular/core";
import type {
  BrandKitView,
  FlyerApprovalView,
  FlyerSummaryView,
  FlyerTemplateView,
  FlyerTimelineView,
  FlyerVariantView,
  FlyerVersionView,
  MediaAssetView,
} from "../flyer.models";
import type { FlyerLayerView } from "../services/flyer-canvas.service";
@Component({
  selector: "app-flyer-template-gallery",
  standalone: true,
  template: `<section>
    <h2>Templates</h2>
    <div class="cards">
      @for (t of templates(); track t.id) {
        <button (click)="selected.emit(t)" [class.active]="t.id === activeId()">
          <span
            class="thumb"
            [style.background-image]="
              t.previewUrl ? 'url(' + t.previewUrl + ')' : null
            "
            [style.background]="
              !t.previewUrl
                ? 'linear-gradient(135deg,' + t.palette.join(',') + ')'
                : null
            "
          ></span
          ><strong>{{ t.name }}</strong
          ><small>{{ t.description }}</small>
        </button>
      }
    </div>
  </section>`,
  styles: [
    `
      .cards {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
      }
      .cards button {
        display: grid;
        text-align: left;
        gap: 0.3rem;
        padding: 0.45rem;
        border: 1px solid var(--line);
        border-radius: 10px;
        background: white;
      }
      .cards button.active {
        outline: 2px solid #7457cb;
      }
      .thumb {
        height: 70px;
        border-radius: 7px;
        background-size: cover;
        background-position: center;
      }
    `,
  ],
})
export class FlyerTemplateGalleryComponent {
  templates = input.required<readonly FlyerTemplateView[]>();
  activeId = input<string>();
  selected = output<FlyerTemplateView>();
}
@Component({
  selector: "app-flyer-layer-panel",
  standalone: true,
  template: `<section>
    <h2>Layers</h2>
    <div role="list">
      @for (l of layers(); track l.id) {
        <div class="row" role="listitem">
          <button (click)="select.emit(l.id)">{{ l.name }}</button
          ><button
            (click)="visibility.emit(l.id)"
            [attr.aria-label]="(l.visible ? 'Hide ' : 'Show ') + l.name"
          >
            {{ l.visible ? "◉" : "○" }}</button
          ><button
            (click)="lock.emit(l.id)"
            [attr.aria-label]="(l.locked ? 'Unlock ' : 'Lock ') + l.name"
          >
            {{ l.locked ? "🔒" : "🔓" }}
          </button>
        </div>
      } @empty {
        <p class="muted">Add an element to begin.</p>
      }
    </div>
  </section>`,
  styles: [
    `
      .row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 0.3rem;
        margin: 0.35rem 0;
      }
      .row button:first-child {
        text-align: left;
      }
    `,
  ],
})
export class FlyerLayerPanelComponent {
  layers = input.required<readonly FlyerLayerView[]>();
  select = output<string>();
  visibility = output<string>();
  lock = output<string>();
}
@Component({
  selector: "app-flyer-brand-kit",
  standalone: true,
  template: `<section>
    <h2>Brand kit</h2>
    @if (brand(); as b) {
      <strong>{{ b.churchName || "Organization brand" }}</strong>
      <div class="colors">
        @for (c of colors(); track c) {
          <span [style.background]="c" [title]="c"></span>
        }
      </div>
      <button class="btn secondary" (click)="apply.emit()">
        Apply Brand Kit
      </button>
    } @else {
      <p class="muted">Brand kit unavailable.</p>
    }
  </section>`,
  styles: [
    `
      .colors {
        display: flex;
        gap: 0.3rem;
        margin: 0.6rem 0;
      }
      .colors span {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 1px solid #0002;
      }
    `,
  ],
})
export class FlyerBrandKitComponent {
  brand = input<BrandKitView | null>();
  colors() {
    const b = this.brand();
    return b ? [...b.primaryColors, ...b.secondaryColors] : [];
  }
  apply = output();
}
@Component({
  selector: "app-flyer-asset-picker",
  standalone: true,
  template: `<section>
    <h2>Media assets</h2>
    <nav>
      @for (k of kinds; track k) {
        <button (click)="kind = k" [class.active]="kind === k">{{ k }}</button>
      }
    </nav>
    <label class="upload"
      >Upload<input type="file" accept="image/*" (change)="upload.emit($event)"
    /></label>
    <div class="assets">
      @for (a of filtered(); track a.id) {
        <button (click)="insert.emit(a)">
          <img [src]="a.thumbnailUrl || a.url" [alt]="a.name" /><span>{{
            a.name
          }}</span>
        </button>
      } @empty {
        <p class="muted">No assets in this category.</p>
      }
    </div>
  </section>`,
  styles: [
    `
      nav {
        display: flex;
        gap: 0.25rem;
        overflow: auto;
      }
      nav button {
        font-size: 0.72rem;
      }
      .upload {
        display: block;
        margin: 0.6rem 0;
      }
      .assets {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.4rem;
      }
      .assets button {
        display: grid;
        gap: 0.2rem;
      }
      .assets img {
        width: 100%;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
      }
    `,
  ],
})
export class FlyerAssetPickerComponent {
  assets = input.required<readonly MediaAssetView[]>();
  insert = output<MediaAssetView>();
  upload = output<Event>();
  kind = "recent";
  kinds = ["recent", "logo", "speaker", "background", "event"];
  filtered() {
    return this.kind === "recent"
      ? this.assets()
      : this.assets().filter((x) => x.kind === this.kind);
  }
}
@Component({
  selector: "app-flyer-recent-work",
  standalone: true,
  template: `<section>
    <h2>Recent Work</h2>
    @if (error()) {
      <p class="error">Recent work could not load.</p>
    }
    @for (x of items(); track x.id) {
      <button class="work" (click)="selected.emit(x.id)">
        @if (x.thumbnailUrl) {
          <img [src]="x.thumbnailUrl" [alt]="x.title + ' thumbnail'" />
        }
        <span
          ><strong>{{ x.title }}</strong
          ><small
            >{{ x.width }}×{{ x.height }} · {{ x.status.replace("_", " ") }} ·
            v{{ x.versionNumber || "—" }}</small
          ></span
        >
      </button>
    } @empty {
      <p class="muted">No saved flyers yet.</p>
    }
  </section>`,
  styles: [
    `
      .work {
        width: 100%;
        display: flex;
        gap: 0.5rem;
        text-align: left;
        padding: 0.45rem;
        margin: 0.35rem 0;
      }
      .work img {
        width: 48px;
        height: 58px;
        object-fit: cover;
      }
      .work span {
        display: grid;
      }
      .work small {
        color: #667085;
      }
    `,
  ],
})
export class FlyerRecentWorkComponent {
  items = input.required<readonly FlyerSummaryView[]>();
  error = input(false);
  selected = output<string>();
}
@Component({
  selector: "app-flyer-workflow-panels",
  standalone: true,
  imports: [CommonModule],
  template: `<section>
      <h2>Versions</h2>
      @if (versionsError()) {
        <p class="error">Versions unavailable.</p>
      }
      @for (v of versions(); track v.id) {
        <p>
          <strong>v{{ v.versionNumber }}</strong> ·
          {{ v.changeSummary || "Saved revision" }}<br /><small
            >{{ v.renderStatus.replace("_", " ") }} ·
            {{ v.approvalStatus || "Not submitted" }}</small
          >
        </p>
      } @empty {
        <p class="muted">No immutable versions yet.</p>
      }
    </section>
    <section>
      <h2>Timeline</h2>
      @if (timelineError()) {
        <p class="error">Timeline unavailable.</p>
      }
      <ol>
        @for (e of timeline(); track e.id) {
          <li>
            <strong>{{ e.label }}</strong
            ><small>{{ e.createdAt | date: "short" }}</small>
          </li>
        } @empty {
          <li class="muted">Activity appears after save.</li>
        }
      </ol>
    </section>
    <section>
      <h2>Approval</h2>
      @if (approvalError()) {
        <p class="error">Approval unavailable.</p>
      }
      @if (approval(); as a) {
        <p class="badge">{{ a.status.replace("_", " ") }}</p>
        <p>Immutable version v{{ a.versionNumber || "—" }}</p>
      } @else {
        <p>Not submitted</p>
      }
    </section>`,
  styles: [
    `
      section {
        border-top: 1px solid var(--line);
        padding-top: 0.6rem;
        margin-top: 0.6rem;
      }
      ol {
        padding-left: 1rem;
      }
      li {
        margin: 0.4rem 0;
      }
      li small {
        display: block;
        color: #667085;
      }
      .badge {
        text-transform: capitalize;
      }
    `,
  ],
})
export class FlyerWorkflowPanelsComponent {
  versions = input.required<readonly FlyerVersionView[]>();
  timeline = input.required<readonly FlyerTimelineView[]>();
  approval = input<FlyerApprovalView | null>();
  versionsError = input(false);
  timelineError = input(false);
  approvalError = input(false);
}
@Component({
  selector: "app-flyer-render-variants",
  standalone: true,
  template: `<section class="variants">
    <h2>Rendered variants</h2>
    <div role="tablist">
      @for (v of variants(); track v.id) {
        <button
          role="tab"
          [attr.aria-selected]="v.id === selectedId"
          (click)="selectedId = v.id"
        >
          {{ v.name }}
        </button>
      }
    </div>
    @for (v of variants(); track v.id) {
      @if (v.id === selectedId) {
        <article>
          @if (v.previewUrl) {
            <img [src]="v.previewUrl" [alt]="v.name + ' rendered preview'" />
          }
          <p>
            {{ v.width }} × {{ v.height }} ·
            {{ v.renderStatus.replace("_", " ") }}
          </p>
          @if (v.downloadUrl) {
            <a class="btn secondary" [href]="v.downloadUrl">Download</a>
          }
        </article>
      }
    } @empty {
      <p class="muted">
        Generate the flyer to create backend-rendered variants.
      </p>
    }
  </section>`,
  styles: [
    `
      .variants {
        background: white;
        border-radius: 12px;
        padding: 0.7rem;
      }
      .variants [role="tablist"] {
        display: flex;
        gap: 0.3rem;
        overflow: auto;
      }
      .variants img {
        display: block;
        max-height: 260px;
        max-width: 100%;
        margin: 0.5rem auto;
      }
    `,
  ],
})
export class FlyerRenderVariantsComponent {
  variants = input.required<readonly FlyerVariantView[]>();
  selectedId = "";
}
@Component({
  selector: "app-flyer-export-panel",
  standalone: true,
  template: `<section>
    <h2>Production export</h2>
    <label
      >Variant<select #variant>
        @for (v of variants(); track v.id) {
          <option [value]="v.id">
            {{ v.name }} · {{ v.width }}×{{ v.height }}
          </option>
        }
      </select></label
    ><label
      >Format<select #format>
        <option value="png">PNG</option>
        <option value="jpg">JPG</option>
        <option value="webp">WebP</option>
        <option value="pdf">PDF</option>
      </select></label
    ><button
      class="btn"
      [disabled]="!variant.value || dirty()"
      (click)="
        exported.emit({ variantId: variant.value, format: $any(format.value) })
      "
    >
      Request export
    </button>
    @if (dirty()) {
      <p class="muted">Save and render current edits before exporting.</p>
    }
  </section>`,
  styles: [
    `
      label {
        display: grid;
        margin: 0.5rem 0;
      }
    `,
  ],
})
export class FlyerExportPanelComponent {
  variants = input.required<readonly FlyerVariantView[]>();
  dirty = input.required<boolean>();
  exported = output<{
    variantId: string;
    format: "png" | "jpg" | "webp" | "pdf";
  }>();
}
