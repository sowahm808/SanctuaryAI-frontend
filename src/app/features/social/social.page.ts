import { Component, signal } from "@angular/core";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .workspace {
        grid-template-columns: 360px 1fr;
      }
      .platforms {
        display: flex;
        gap: 0.5rem;
      }
      .previews {
        grid-template-columns: repeat(3, 1fr);
        align-items: start;
      }
      .preview {
        overflow: hidden;
      }
      .media {
        aspect-ratio: 1;
        background: #2b1d57;
        color: white;
        display: grid;
        place-items: center;
        text-align: center;
        font-size: 1.5rem;
        padding: 2rem;
      }
      .phone .media {
        aspect-ratio: 9/16;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
      }
      @media (max-width: 1050px) {
        .previews {
          grid-template-columns: 1fr 1fr;
        }
      }
      @media (max-width: 760px) {
        .workspace,
        .previews {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
  template: `<p class="eyebrow">Social publisher</p>
    <h1>Create platform-ready content</h1>
    <div class="grid workspace">
      <form class="card grid" [formGroup]="form">
        <h2>Publishing details</h2>
        <div class="field">
          <label>Connected accounts</label>
          <div class="platforms">
            <label><input type="checkbox" /> Facebook</label
            ><label><input type="checkbox" /> Instagram</label
            ><label><input type="checkbox" /> TikTok</label>
          </div>
        </div>
        <div class="field">
          <label>Media asset</label
          ><button type="button" class="btn secondary">
            Choose from media library
          </button>
        </div>
        <div class="field">
          <label>Caption</label
          ><textarea rows="6" formControlName="caption"></textarea
          ><small class="muted"
            >{{ form.controls.caption.value.length }} / 2,200</small
          >
        </div>
        <button type="button" class="btn secondary">
          ✦ Generate platform captions
        </button>
        <div class="field">
          <label>Publish date and time</label
          ><input type="datetime-local" formControlName="date" />
        </div>
        <div class="actions">
          <button type="button" class="btn secondary">
            Submit for approval</button
          ><button type="button" class="btn" (click)="schedule()">
            Schedule
          </button>
        </div>
        <span class="badge">{{ status() }}</span>
      </form>
      <section>
        <h2>Platform previews</h2>
        <div class="grid previews">
          <article class="card preview">
            <b>f Connected account</b>
            <p>{{ form.controls.caption.value }}</p>
            <div class="media">Selected media</div>
            <small>Like · Comment · Share</small>
          </article>
          <article class="card preview">
            <b>◎ Connected account</b>
            <div class="media">Selected media</div>
            <p>{{ form.controls.caption.value }}</p>
          </article>
          <article class="card preview phone">
            <b>♪ TikTok preview</b>
            <div class="media">Vertical video required</div>
            <p>Direct Post · Public</p>
          </article>
        </div>
      </section>
    </div>`,
})
export class SocialPage {
  readonly status = signal("Draft");
  readonly form = new FormGroup({
    caption: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(2200)],
    }),
    date: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });
  schedule() {
    if (this.form.valid) this.status.set("Scheduled");
  }
}
