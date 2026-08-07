import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  input,
  viewChild,
} from "@angular/core";
import { FlyerCanvasService } from "../../services/flyer-canvas.service";
@Component({
  selector: "app-flyer-canvas",
  standalone: true,
  template: `<div class="stage">
    <canvas #canvas aria-label="Interactive flyer editor"></canvas>
    <p class="help">
      Select elements to edit. Use Ctrl/⌘+Z to undo and Delete to remove a
      selected layer.
    </p>
  </div>`,
  styles: [
    `
      .stage {
        display: grid;
        place-items: center;
        min-height: 620px;
        background: #e8e7ec;
        border-radius: 16px;
        overflow: auto;
        padding: 1rem;
        max-width: 100%;
      }
      canvas {
        box-shadow: 0 14px 40px #10182830;
      }
      .help {
        font-size: 0.8rem;
        color: #555;
        text-align: center;
      }
      @media (max-width: 700px) {
        .stage {
          min-height: 400px;
          padding: 0.5rem;
        }
      }
    `,
  ],
})
export class FlyerCanvasComponent implements AfterViewInit, OnDestroy {
  width = input.required<number>();
  height = input.required<number>();
  canvas = viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  constructor(private service: FlyerCanvasService) {}
  ngAfterViewInit() {
    this.service.initialize(
      this.canvas().nativeElement,
      this.width(),
      this.height(),
    );
  }
  ngOnDestroy() {
    this.service.destroy();
  }
}
