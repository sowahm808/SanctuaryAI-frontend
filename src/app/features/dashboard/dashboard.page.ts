import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: block; }
    .welcome { display: flex; justify-content: space-between; align-items: flex-end; gap: 2rem; margin-bottom: 1.75rem; }
    .welcome h1 { max-width: 680px; margin-bottom: .45rem; font-size: clamp(1.9rem, 3vw, 2.75rem); letter-spacing: -.045em; }
    .welcome p { margin-bottom: 0; }
    .primary-action { display: flex; align-items: center; gap: .65rem; white-space: nowrap; box-shadow: 0 8px 20px #5b3eb333; }
    .primary-action span { font-size: 1.2rem; line-height: 1; }
    .metrics { grid-template-columns: repeat(4, 1fr); margin-bottom: 1.25rem; }
    .metric { position: relative; min-height: 148px; overflow: hidden; }
    .metric::after { content: ''; position: absolute; width: 78px; height: 78px; right: -25px; top: -25px; border-radius: 50%; background: var(--metric-tint, #f1edff); }
    .metric-head { display: flex; align-items: center; gap: .65rem; color: var(--muted); font-size: .84rem; font-weight: 650; }
    .metric-icon { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: var(--metric-tint, #f1edff); color: var(--metric-color, var(--violet)); font-size: 1rem; }
    .metric strong { display: block; margin: .7rem 0 .3rem; font-size: 2rem; line-height: 1; letter-spacing: -.04em; }
    .metric small { color: var(--muted); }
    .metric small b { color: var(--green); font-weight: 700; }
    .metric.warning small b { color: var(--danger); }
    .dashboard { grid-template-columns: minmax(0, 1.7fr) minmax(300px, .82fr); align-items: start; }
    .column { display: grid; gap: 1rem; }
    .campaign { padding: 0; overflow: hidden; }
    .campaign-cover { position: relative; min-height: 205px; padding: 1.65rem; color: #fff; background: radial-gradient(circle at 85% 20%, #a990f050 0 12%, transparent 13%), radial-gradient(circle at 90% 20%, #a990f030 0 25%, transparent 26%), linear-gradient(130deg, #27184f 0%, #503294 62%, #7154bf 100%); }
    .campaign-cover::after { content: '✦'; position: absolute; right: 2rem; bottom: .2rem; color: #ffffff13; font-size: 8rem; transform: rotate(12deg); }
    .campaign-kicker { display: flex; align-items: center; justify-content: space-between; gap: 1rem; position: relative; z-index: 1; }
    .campaign-kicker .eyebrow { color: #dcd1ff; margin: 0; }
    .live { padding: .35rem .65rem; border: 1px solid #ffffff40; border-radius: 999px; background: #ffffff16; font-size: .72rem; font-weight: 750; }
    .campaign h2 { position: relative; z-index: 1; max-width: 520px; margin: 2rem 0 .45rem; font-size: clamp(1.55rem, 2.5vw, 2.15rem); letter-spacing: -.035em; }
    .campaign-cover > p { position: relative; z-index: 1; margin: 0; color: #dfd8ef; }
    .campaign-body { padding: 1.3rem 1.65rem 1.5rem; }
    .progress-copy { display: flex; justify-content: space-between; margin-bottom: .6rem; font-size: .82rem; font-weight: 700; }
    .progress-copy span:last-child { color: var(--violet); }
    .progress { height: 8px; border-radius: 999px; overflow: hidden; background: #ece9f3; }
    .progress i { display: block; width: 68%; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--violet), #9075dc); }
    .campaign-footer { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-top: 1.1rem; }
    .avatars { display: flex; align-items: center; color: var(--muted); font-size: .78rem; }
    .avatar-dot { display: grid; place-items: center; width: 29px; height: 29px; margin-right: -7px; border: 2px solid #fff; border-radius: 50%; color: white; background: #d39365; font-size: .65rem; font-weight: 800; }
    .avatar-dot:nth-child(2) { background: #6e86b7; }
    .avatars span:last-child { margin-left: 15px; }
    .section-head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .9rem; }
    .section-head h2 { margin: 0; font-size: 1.08rem; }
    .text-link { color: var(--violet); text-decoration: none; font-size: .8rem; font-weight: 750; }
    .work-list { display: grid; }
    .work-item { display: grid; grid-template-columns: 42px minmax(0, 1fr) auto; align-items: center; gap: .85rem; padding: .9rem 0; border-top: 1px solid var(--line); }
    .work-item:first-child { border-top: 0; padding-top: .25rem; }
    .work-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; color: #6146aa; background: #f0ebfc; }
    .work-item:nth-child(2) .work-icon { color: #b36d15; background: #fff3df; }
    .work-item:nth-child(3) .work-icon { color: #147d64; background: #e6f6f1; }
    .work-item b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: .88rem; }
    .work-item small { color: var(--muted); font-size: .75rem; }
    .status { padding: .3rem .55rem; border-radius: 999px; color: #6543b7; background: #f0eafe; font-size: .7rem; font-weight: 750; }
    .status.review { color: #956018; background: #fff3dc; }
    .status.approved { color: var(--green); background: #e8f7f2; }
    .quick-grid { grid-template-columns: repeat(2, 1fr); gap: .65rem; }
    .quick { display: flex; align-items: center; gap: .65rem; padding: .8rem; border: 1px solid var(--line); border-radius: 12px; color: var(--ink); background: #fff; text-decoration: none; font-size: .8rem; font-weight: 700; transition: transform .15s, border-color .15s, box-shadow .15s; }
    .quick:hover { transform: translateY(-2px); border-color: #cabfec; box-shadow: 0 8px 18px #26164b0d; }
    .quick span { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 auto; border-radius: 9px; color: var(--violet); background: #f2eefc; }
    .schedule-date { display: flex; align-items: center; gap: .8rem; padding: .85rem 0; border-top: 1px solid var(--line); }
    .schedule-date:first-of-type { border-top: 0; }
    .date { width: 40px; text-align: center; color: var(--muted); font-size: .65rem; font-weight: 800; text-transform: uppercase; }
    .date strong { display: block; color: var(--ink); font-size: 1.2rem; line-height: 1.1; }
    .event { flex: 1; padding-left: .8rem; border-left: 3px solid #7658c8; }
    .event.gold { border-color: #df9d44; }
    .event b { display: block; font-size: .83rem; }
    .event small { color: var(--muted); font-size: .72rem; }
    .channel { display: flex; align-items: center; gap: .7rem; padding: .7rem 0; border-top: 1px solid var(--line); font-size: .82rem; }
    .channel:first-of-type { border-top: 0; }
    .channel-icon { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 9px; color: white; background: #2f63b5; font-weight: 800; }
    .channel:nth-of-type(2) .channel-icon { background: linear-gradient(135deg, #6e3bc4, #d95777, #ed9a3a); }
    .channel:nth-of-type(3) .channel-icon { background: #111; }
    .health { margin-left: auto; color: var(--green); font-size: .72rem; font-weight: 750; }
    .health::before { content: ''; display: inline-block; width: 6px; height: 6px; margin-right: .35rem; border-radius: 50%; background: currentColor; }
    .health.warning { color: #c27817; }
    @media (max-width: 1080px) { .metrics { grid-template-columns: repeat(2, 1fr); } .dashboard { grid-template-columns: 1fr; } .right { grid-template-columns: repeat(2, 1fr); } .right .channels { grid-column: 1 / -1; } }
    @media (max-width: 640px) { .welcome { align-items: flex-start; flex-direction: column; } .metrics, .right { grid-template-columns: 1fr; } .right .channels { grid-column: auto; } .metric { min-height: 125px; } .campaign-footer { align-items: flex-start; flex-direction: column; } .work-item { grid-template-columns: 42px minmax(0, 1fr); } .work-item .status { grid-column: 2; justify-self: start; } }
  `],
  template: `
    <header class="welcome">
      <div>
        <p class="eyebrow">Thursday, 30 July</p>
        <h1>Good morning, Pastor Kwame.</h1>
        <p class="muted">Here’s what’s happening across your ministry today.</p>
      </div>
      <a class="btn primary-action" routerLink="/app/campaigns"><span>＋</span> New campaign</a>
    </header>

    <section class="grid metrics" aria-label="Operational summary">
      <article class="card metric" style="--metric-tint:#f0ebfc;--metric-color:#6346ae">
        <div class="metric-head"><span class="metric-icon">✓</span> Awaiting review</div>
        <strong>6</strong><small><b>↑ 2 new</b> since yesterday</small>
      </article>
      <article class="card metric" style="--metric-tint:#e9f6f1;--metric-color:#147d64">
        <div class="metric-head"><span class="metric-icon">⌁</span> Ready to schedule</div>
        <strong>12</strong><small>Across 3 active campaigns</small>
      </article>
      <article class="card metric" style="--metric-tint:#fff3df;--metric-color:#b87518">
        <div class="metric-head"><span class="metric-icon">▦</span> Scheduled this week</div>
        <strong>18</strong><small><b>On track</b> for this week</small>
      </article>
      <article class="card metric warning" style="--metric-tint:#fceceb;--metric-color:#b42318">
        <div class="metric-head"><span class="metric-icon">!</span> Publishing issues</div>
        <strong>1</strong><small><b>Instagram</b> reconnect needed</small>
      </article>
    </section>

    <div class="grid dashboard">
      <section class="column">
        <article class="card campaign">
          <div class="campaign-cover">
            <div class="campaign-kicker"><p class="eyebrow">July campaign</p><span class="live">● Active</span></div>
            <h2>Walking in Kingdom Authority</h2>
            <p>Luke 10:19 · 4-week teaching series</p>
          </div>
          <div class="campaign-body">
            <div class="progress-copy"><span>Campaign progress</span><span>68%</span></div>
            <div class="progress" aria-label="Campaign 68 percent complete"><i></i></div>
            <div class="campaign-footer">
              <div class="avatars"><span class="avatar-dot">PK</span><span class="avatar-dot">AM</span><span>8 of 12 assets approved</span></div>
              <a class="btn secondary" routerLink="/app/campaigns">Open campaign →</a>
            </div>
          </div>
        </article>

        <article class="card">
          <div class="section-head"><h2>Continue working</h2><a class="text-link" routerLink="/app/workspace/themes">View all</a></div>
          <div class="work-list">
            <div class="work-item"><span class="work-icon">✎</span><span><b>The Authority of the Believer</b><small>Sermon · Edited 8 min ago</small></span><span class="status">Draft</span></div>
            <div class="work-item"><span class="work-icon">♢</span><span><b>August prayer collection</b><small>Prayer points · 18 items</small></span><span class="status review">In review</span></div>
            <div class="work-item"><span class="work-icon">▧</span><span><b>Youth Encounter flyer</b><small>Design · 1080 × 1350</small></span><span class="status approved">Approved</span></div>
          </div>
        </article>
      </section>

      <aside class="column right">
        <article class="card">
          <div class="section-head"><h2>Quick create</h2></div>
          <div class="grid quick-grid">
            <a class="quick" routerLink="/app/workspace/themes"><span>✦</span>Theme</a>
            <a class="quick" routerLink="/app/sermons"><span>✎</span>Sermon</a>
            <a class="quick" routerLink="/app/workspace/prayer-points"><span>♢</span>Prayers</a>
            <a class="quick" routerLink="/app/flyer-studio"><span>▧</span>Flyer</a>
            <a class="quick" routerLink="/app/social"><span>◎</span>Social post</a>
            <a class="quick" routerLink="/app/workspace/videos"><span>▶</span>Video</a>
          </div>
        </article>

        <article class="card">
          <div class="section-head"><h2>Coming up</h2><a class="text-link" routerLink="/app/workspace/calendar">Calendar</a></div>
          <div class="schedule-date"><div class="date">Aug<strong>02</strong></div><div class="event"><b>Sunday celebration</b><small>9:00 AM · Main auditorium</small></div></div>
          <div class="schedule-date"><div class="date">Aug<strong>05</strong></div><div class="event gold"><b>Midweek teaching</b><small>6:30 PM · Live stream</small></div></div>
        </article>

        <article class="card channels">
          <div class="section-head"><h2>Connected channels</h2><a class="text-link" routerLink="/app/workspace/settings">Manage</a></div>
          <div class="channel"><span class="channel-icon">f</span>Facebook<span class="health">Healthy</span></div>
          <div class="channel"><span class="channel-icon">◎</span>Instagram<span class="health warning">Reconnect</span></div>
          <div class="channel"><span class="channel-icon">♪</span>TikTok<span class="health">Healthy</span></div>
        </article>
      </aside>
    </div>
  `,
})
export class DashboardPage {}
