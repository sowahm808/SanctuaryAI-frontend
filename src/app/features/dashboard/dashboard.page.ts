import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
@Component({
  standalone: true,
  imports: [RouterLink],
  styles: [
    `
      .head {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 1rem;
      }
      .metrics {
        grid-template-columns: repeat(4, 1fr);
        margin: 1.5rem 0;
      }
      .metric strong {
        font-size: 1.8rem;
        display: block;
      }
      .layout {
        grid-template-columns: 2fr 1fr;
      }
      .progress {
        height: 8px;
        background: #eee;
        border-radius: 9px;
        overflow: hidden;
      }
      .progress i {
        display: block;
        width: 68%;
        height: 100%;
        background: var(--violet);
      }
      .actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }
      .list {
        display: grid;
        gap: 0.7rem;
      }
      .item {
        padding: 0.8rem 0;
        border-bottom: 1px solid var(--line);
        display: flex;
        justify-content: space-between;
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
  template: ` <header class="head">
      <div>
        <p class="eyebrow">Thursday, 30 July</p>
        <h1>Ministry command center</h1>
        <p class="muted">
          Good morning. Here is what needs your team's attention.
        </p>
      </div>
      <a class="btn" routerLink="/app/monthly-campaigns">+ New campaign</a>
    </header>
    <section class="grid metrics" aria-label="Operational summary">
      <div class="card metric">
        <span class="muted">Awaiting review</span><strong>6</strong
        ><span class="badge">2 due today</span>
      </div>
      <div class="card metric">
        <span class="muted">Ready to schedule</span><strong>12</strong
        ><span class="muted">Across 3 campaigns</span>
      </div>
      <div class="card metric">
        <span class="muted">Scheduled this week</span><strong>18</strong
        ><span class="badge">On track</span>
      </div>
      <div class="card metric">
        <span class="muted">Publishing issues</span><strong>1</strong
        ><span style="color:var(--danger)">Instagram reconnect needed</span>
      </div>
    </section>
    <div class="grid layout">
      <section class="grid">
        <article class="card">
          <p class="eyebrow">July campaign</p>
          <h2>Walking in Kingdom Authority</h2>
          <p>Luke 10:19 · 4-week teaching series</p>
          <div class="progress"><i></i></div>
          <p class="muted" style="margin-top:.7rem">
            8 of 12 assets approved · Next service Sunday, 9:00 AM
          </p>
          <div class="actions">
            <a class="btn secondary" routerLink="/app/monthly-campaigns"
              >Open campaign</a
            ><a class="btn secondary" routerLink="/app/reviews"
              >Review 3 items</a
            >
          </div>
        </article>
        <article class="card">
          <h2>Work in progress</h2>
          <div class="list">
            <div class="item">
              <span
                ><b>The Authority of the Believer</b><br /><small class="muted"
                  >Sermon · autosaved 8 min ago</small
                ></span
              ><span class="badge">Draft</span>
            </div>
            <div class="item">
              <span
                ><b>August prayer collection</b><br /><small class="muted"
                  >18 prayer points</small
                ></span
              ><span class="badge">Review</span>
            </div>
            <div class="item">
              <span
                ><b>Youth Encounter flyer</b><br /><small class="muted"
                  >1080 × 1350</small
                ></span
              ><span class="badge">Approved</span>
            </div>
          </div>
        </article>
      </section>
      <aside class="grid">
        <article class="card">
          <h2>Quick create</h2>
          <div class="actions">
            <a class="btn secondary" routerLink="/app/workspace/themes"
              >✦ Theme</a
            ><a class="btn secondary" routerLink="/app/sermons">✎ Sermon</a
            ><a class="btn secondary" routerLink="/app/workspace/prayer-points"
              >♢ Prayers</a
            ><a class="btn secondary" routerLink="/app/flyer-studio">▧ Flyer</a
            ><a class="btn secondary" routerLink="/app/social-publisher"
              >◎ Social post</a
            >
          </div>
        </article>
        <article class="card">
          <h2>Connected channels</h2>
          <div class="list">
            <div class="item">
              <span>Facebook</span><span class="badge">Healthy</span>
            </div>
            <div class="item">
              <span>Instagram</span
              ><span style="color:var(--danger)">Expires soon</span>
            </div>
            <div class="item">
              <span>TikTok</span><span class="badge">Healthy</span>
            </div>
          </div>
        </article>
      </aside>
    </div>`,
})
export class DashboardPage {}
