import { DatePipe } from "@angular/common";
import { Component, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import type { ApiProblem, ThemeComment } from "./theme.models";
@Component({
  selector: "app-theme-comments",
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `<section class="card">
    <p class="eyebrow">Comments</p>
    <h2>Conversation</h2>
    @if (error()) {
      <p class="error">Unable to load comments.</p>
    }
    @for (c of comments(); track c.id) {
      <article>
        <b>{{ c.author || "Team member" }}</b
        ><small> · {{ c.createdAt | date: "medium" }}</small>
        <p>{{ c.body }}</p>
      </article>
    } @empty {
      <p class="muted">No comments yet.</p>
    }
    <div class="field">
      <label for="theme-comment">Add a comment</label
      ><textarea id="theme-comment" rows="3" [(ngModel)]="draft"></textarea>
    </div>
    <button
      class="btn secondary"
      type="button"
      [disabled]="!draft().trim()"
      (click)="send()"
    >
      Post comment
    </button>
  </section>`,
})
export class ThemeCommentsComponent {
  readonly comments = input<readonly ThemeComment[]>([]);
  readonly error = input<ApiProblem | null>();
  readonly add = output<string>();
  readonly draft = signal("");
  send() {
    this.add.emit(this.draft().trim());
    this.draft.set("");
  }
}
