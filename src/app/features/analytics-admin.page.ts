import { Component, signal } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule } from "@angular/forms";
interface Metric {
  readonly name: string;
  readonly value: string;
  readonly state: "loading" | "ready" | "empty" | "error";
  readonly summary: string;
}
@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [
    `
      .filters,
      .grid3,
      .actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .metric,
      .panel {
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 1rem;
      }
      .grid3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
      }
      @media (max-width: 900px) {
        .grid3 {
          grid-template-columns: 1fr;
        }
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        border-bottom: 1px solid var(--line);
        padding: 0.65rem;
        text-align: left;
      }
    `,
  ],
  template: `<p class="eyebrow">Analytics and administration</p>
    <h1>Insights, notifications, team, subscription, and settings</h1>
    <section class="card grid">
      <h2>Analytics filters</h2>
      <form class="filters" [formGroup]="filters">
        <div class="field">
          <label>Date range</label
          ><select formControlName="date">
            <option>Last 30 days</option>
            <option>This month</option>
            <option>Last quarter</option>
          </select>
        </div>
        <div class="field">
          <label>Platform</label
          ><select formControlName="platform">
            <option>All</option>
            <option>Facebook</option>
            <option>Instagram</option>
            <option>TikTok</option>
          </select>
        </div>
        <div class="field">
          <label>Campaign</label><input formControlName="campaign" />
        </div>
      </form>
      <div class="grid3">
        @for (metric of metrics(); track metric.name) {
          <article class="metric">
            <span
              class="badge"
              [class.warning]="metric.state === 'loading'"
              [class.danger]="metric.state === 'error'"
              >{{ metric.state }}</span
            >
            <h3>{{ metric.name }}</h3>
            <p class="value">{{ metric.value }}</p>
            <p>{{ metric.summary }}</p>
            <button class="btn secondary" type="button">Retry</button>
          </article>
        }
      </div>
      <h3>Accessible table alternative</h3>
      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
            <th>Definition</th>
          </tr>
        </thead>
        <tbody>
          @for (metric of metrics(); track metric.name) {
            <tr>
              <td>{{ metric.name }}</td>
              <td>{{ metric.value }}</td>
              <td>{{ metric.summary }}</td>
            </tr>
          }
        </tbody>
      </table>
      <p class="muted">
        Definitions document provider delays, time zones, partial data,
        generated/approved content, publishing outcomes, engagement, reach,
        views, reactions, shares, saves, clicks, followers, AI usage, and top
        content.
      </p>
    </section>
    <section class="grid3" style="margin-top:1rem">
      <article class="panel">
        <h2>Notification center</h2>
        <p>
          Unread state, preferences, deep links, and safe bulk mark-read/archive
          actions.
        </p>
      </article>
      <article class="panel">
        <h2>Team management</h2>
        <p>
          Membership, invitations, role and permission assignment, removal, and
          pending invitation workflows.
        </p>
      </article>
      <article class="panel">
        <h2>Subscription</h2>
        <p>
          Status, entitlements, grace-period, upgrade/contact workflows, and
          server-side enforcement reminders.
        </p>
      </article>
      <article class="panel">
        <h2>Church settings</h2>
        <p>
          Identity, brand, doctrine policies, services, defaults, integrations,
          and account preferences.
        </p>
      </article>
    </section>`,
})
export class AnalyticsAdminPage {
  readonly filters = new FormGroup({
    date: new FormControl("Last 30 days", { nonNullable: true }),
    platform: new FormControl("All", { nonNullable: true }),
    campaign: new FormControl("", { nonNullable: true }),
  });
  readonly metrics = signal<Metric[]>([
    {
      name: "Generated content",
      value: "42",
      state: "ready",
      summary: "AI generations by content type after deduplication.",
    },
    {
      name: "Publishing outcomes",
      value: "18 published / 2 failed",
      state: "ready",
      summary: "Provider-confirmed publishing attempts and final states.",
    },
    {
      name: "Engagement",
      value: "1,284",
      state: "ready",
      summary:
        "Reactions, shares, saves, clicks, views, and comments where providers expose them.",
    },
    {
      name: "Reach",
      value: "Delayed",
      state: "loading",
      summary: "Provider reach often lags by 24–48 hours.",
    },
    {
      name: "Top content",
      value: "Sunday invitation",
      state: "ready",
      summary: "Ranked by selected campaign, platform, and date range.",
    },
    {
      name: "AI usage",
      value: "31k tokens",
      state: "ready",
      summary:
        "Estimated usage from backend metering; never hardcoded for production.",
    },
  ]);
}
