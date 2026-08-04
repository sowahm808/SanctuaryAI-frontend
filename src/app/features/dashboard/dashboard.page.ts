import { DatePipe, TitleCasePipe } from "@angular/common";
import { Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";
import { finalize } from "rxjs";
import { mapApiError } from "../../core/api/api-error";
import type { ApiError } from "../../models/domain.models";
import {
  SkeletonComponent,
  StatePanelComponent,
} from "../../shared/platform-ui.component";
import type { DashboardSummary } from "./dashboard.models";
import { DashboardService } from "./dashboard.service";

@Component({
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    SkeletonComponent,
    StatePanelComponent,
    TitleCasePipe,
  ],
  styles: [
    `
      .head,
      .item,
      .metric-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
      }
      .head {
        align-items: end;
      }
      .metrics {
        grid-template-columns: repeat(4, 1fr);
        margin: 1.5rem 0;
      }
      .metric strong {
        display: block;
        font-size: 1.8rem;
      }
      .layout {
        grid-template-columns: 2fr 1fr;
      }
      .progress {
        height: 8px;
        overflow: hidden;
        border-radius: 9px;
        background: #eee;
      }
      .progress i {
        display: block;
        height: 100%;
        background: var(--violet);
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
      }
      .list {
        display: grid;
        gap: 0.7rem;
      }
      .item {
        align-items: center;
        padding: 0.8rem 0;
        border-bottom: 1px solid var(--line);
      }
      .item:last-child {
        border-bottom: 0;
      }
      .item a {
        color: inherit;
        text-decoration: none;
      }
      .skeletons {
        margin-top: 1.5rem;
      }
      .skeleton-card {
        min-height: 115px;
      }
      .status-text {
        font-weight: 700;
      }
      .status-text.warning {
        color: var(--warning);
      }
      .status-text.disconnected,
      .status-text.danger {
        color: var(--danger);
      }
      @media (max-width: 1000px) {
        .metrics {
          grid-template-columns: repeat(2, 1fr);
        }
        .layout {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 520px) {
        .metrics {
          grid-template-columns: 1fr;
        }
        .head {
          align-items: start;
          flex-direction: column;
        }
      }
    `,
  ],
  template: `
    <header class="head">
      <div>
        <p class="eyebrow">Ministry operations</p>
        <h1>Ministry command center</h1>
        <p class="muted">Live work that needs your team's attention.</p>
      </div>
      <a class="btn" routerLink="/app/monthly-campaigns">+ New campaign</a>
    </header>

    @if (loading()) {
      <section class="grid metrics skeletons" aria-label="Loading dashboard">
        @for (item of skeletonItems; track item) {
          <div class="card skeleton-card"><app-skeleton /></div>
        }
      </section>
    } @else if (error(); as failure) {
      <app-state-panel
        [state]="failure.code === 'http_0' ? 'offline' : 'error'"
        title="Dashboard unavailable"
        [message]="failure.message"
        actionLabel="Try again"
        (action)="load()"
      />
    } @else if (summary(); as data) {
      <p class="muted">Updated {{ data.generatedAt | date: "medium" }}</p>
      <section class="grid metrics" aria-label="Operational summary">
        @for (metric of data.metrics; track metric.kind) {
          <article class="card metric">
            <span class="muted">{{ metric.label }}</span
            ><strong>{{ metric.value }}</strong>
            <span [class]="'status-text ' + metric.severity">{{
              metric.context
            }}</span>
          </article>
        } @empty {
          <p class="muted">No operational metrics are available.</p>
        }
      </section>
      <div class="grid layout">
        <section class="grid">
          @if (data.currentCampaign; as campaign) {
            <article class="card">
              <p class="eyebrow">{{ campaign.monthLabel }} campaign</p>
              <h2>{{ campaign.title }}</h2>
              @if (campaign.scriptureReference) {
                <p>{{ campaign.scriptureReference }}</p>
              }
              <div
                class="progress"
                role="progressbar"
                aria-label="Campaign assets approved"
                aria-valuemin="0"
                [attr.aria-valuemax]="campaign.totalAssets"
                [attr.aria-valuenow]="campaign.approvedAssets"
              >
                <i
                  [style.width.%]="
                    campaignProgress(
                      campaign.approvedAssets,
                      campaign.totalAssets
                    )
                  "
                ></i>
              </div>
              <p class="muted">
                {{ campaign.approvedAssets }} of
                {{ campaign.totalAssets }} assets approved
                @if (campaign.nextServiceAt) {
                  · Next service {{ campaign.nextServiceAt | date: "medium" }}
                }
              </p>
              <div class="actions">
                <a class="btn secondary" routerLink="/app/monthly-campaigns"
                  >Open campaign</a
                >
                @if (campaign.reviewCount > 0) {
                  <a class="btn secondary" routerLink="/app/reviews"
                    >Review {{ campaign.reviewCount }} items</a
                  >
                }
              </div>
            </article>
          } @else {
            <app-state-panel
              state="empty"
              title="No active campaign"
              message="Create a monthly campaign to coordinate ministry content."
            />
          }
          <article class="card">
            <h2>Work in progress</h2>
            <div class="list">
              @for (item of data.workItems; track item.id) {
                <div class="item">
                  <a [routerLink]="item.href"
                    ><b>{{ item.title }}</b
                    ><br /><small class="muted"
                      >{{ item.type | titlecase }} · {{ item.detail }} · Updated
                      {{ item.updatedAt | date: "short" }}</small
                    ></a
                  ><span class="badge">{{ item.status }}</span>
                </div>
              } @empty {
                <p class="muted">No active work items.</p>
              }
            </div>
          </article>
        </section>
        <aside class="grid">
          <article class="card">
            <h2>Quick create</h2>
            <div class="actions">
              <a class="btn secondary" routerLink="/app/themes">✦ Theme</a
              ><a class="btn secondary" routerLink="/app/sermons">✎ Sermon</a
              ><a class="btn secondary" routerLink="/app/prayer-points"
                >♢ Prayers</a
              ><a class="btn secondary" routerLink="/app/flyer-studio"
                >▧ Flyer</a
              ><a class="btn secondary" routerLink="/app/social-publisher"
                >◎ Social post</a
              >
            </div>
          </article>
          <article class="card">
            <h2>Connected channels</h2>
            <div class="list">
              @for (channel of data.channels; track channel.id) {
                <div class="item">
                  <span
                    >{{ channel.displayName }}
                    <small class="muted">{{
                      channel.provider | titlecase
                    }}</small></span
                  ><span [class]="'status-text ' + channel.status">{{
                    channel.statusLabel
                  }}</span>
                </div>
              } @empty {
                <p class="muted">No social accounts connected.</p>
              }
            </div>
          </article>
        </aside>
      </div>
    }
  `,
})
export class DashboardPage {
  private readonly dashboard = inject(DashboardService);
  private readonly destroyRef = inject(DestroyRef);
  readonly summary = signal<DashboardSummary | null>(null);
  readonly loading = signal(true);
  readonly error = signal<ApiError | null>(null);
  readonly skeletonItems = [1, 2, 3, 4] as const;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboard
      .summary()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (summary) => this.summary.set(summary),
        error: (error: unknown) => {
          this.summary.set(null);
          this.error.set(mapApiError(error));
        },
      });
  }

  campaignProgress(approved: number, total: number): number {
    return total > 0 ? Math.min(100, Math.max(0, (approved / total) * 100)) : 0;
  }
}
