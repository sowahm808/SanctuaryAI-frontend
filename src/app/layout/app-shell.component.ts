import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../services/session.service';

interface NavItem { label: string; icon: string; path: string; section?: string; badge?: string }

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: grid; grid-template-columns: 252px minmax(0, 1fr); min-height: 100vh; }
    .side { position: sticky; top: 0; display: flex; flex-direction: column; height: 100vh; padding: 1.5rem 1rem 1rem; overflow: auto; color: #d9d2eb; background: linear-gradient(180deg, #21163e 0%, #1a1233 100%); }
    .brand { display: flex; align-items: center; gap: .7rem; margin: 0 .55rem 1.65rem; color: #fff; font-size: 1.15rem; font-weight: 800; letter-spacing: -.025em; }
    .brand-mark { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; color: #fff; background: linear-gradient(135deg, #8e70dc, #5d3eb0); box-shadow: 0 6px 16px #0003; }
    .church { display: flex; align-items: center; gap: .7rem; padding: .75rem; margin-bottom: 1.15rem; border: 1px solid #ffffff12; border-radius: 12px; background: #ffffff0a; }
    .church-logo { display: grid; place-items: center; width: 34px; height: 34px; flex: 0 0 auto; border-radius: 9px; color: #2c1d59; background: #f0b966; font-weight: 900; }
    .church small { display: block; margin-bottom: .15rem; color: #978cae; font-size: .62rem; }
    .church strong { display: block; overflow: hidden; color: #f7f5fc; font-size: .75rem; text-overflow: ellipsis; white-space: nowrap; }
    .chevron { margin-left: auto; color: #8e83a6; }
    .nav { display: grid; }
    .nav-label { margin: 1rem .75rem .42rem; color: #786d91; font-size: .61rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; }
    .nav a { display: flex; align-items: center; gap: .7rem; min-height: 39px; padding: .55rem .7rem; border-radius: 9px; color: #bdb5d0; text-decoration: none; font-size: .78rem; font-weight: 550; transition: color .15s, background .15s; }
    .nav a:hover { color: #fff; background: #ffffff0b; }
    .nav a.active { color: #fff; background: linear-gradient(90deg, #694ab7, #5a3ea0); box-shadow: 0 6px 16px #110a2460; }
    .nav-icon { width: 20px; text-align: center; color: #a99ec2; font-size: .95rem; }
    .nav a.active .nav-icon { color: #fff; }
    .nav-badge { margin-left: auto; min-width: 20px; padding: .15rem .35rem; border-radius: 999px; color: #fff; background: #e05e69; text-align: center; font-size: .6rem; font-weight: 800; }
    .help { display: flex; align-items: center; gap: .7rem; margin-top: auto; padding: .8rem; border-top: 1px solid #ffffff10; color: #a69dbb; font-size: .74rem; }
    .main { min-width: 0; }
    .top { position: sticky; top: 0; z-index: 5; display: flex; align-items: center; gap: .85rem; height: 72px; padding: 0 2rem; border-bottom: 1px solid var(--line); background: #ffffffeb; backdrop-filter: blur(12px); }
    .search-wrap { position: relative; width: min(460px, 48vw); }
    .search-icon { position: absolute; left: .85rem; top: 50%; color: #8c93a1; transform: translateY(-50%); }
    .search { width: 100%; padding: .68rem 1rem .68rem 2.4rem; border: 1px solid #e3e3e9; border-radius: 10px; outline: none; color: var(--ink); background: #f8f8fa; font-size: .8rem; }
    .search:focus { border-color: #b9ace0; box-shadow: 0 0 0 3px #eee9fa; }
    .top-actions { display: flex; align-items: center; gap: .6rem; margin-left: auto; }
    .icon-btn { position: relative; color: #555d6d; }
    .notification::after { content: ''; position: absolute; right: 8px; top: 7px; width: 6px; height: 6px; border: 2px solid white; border-radius: 50%; background: #dd5260; }
    .divider { width: 1px; height: 30px; margin: 0 .2rem; background: var(--line); }
    .profile { display: flex; align-items: center; gap: .65rem; border: 0; color: var(--ink); background: transparent; text-align: left; }
    .profile-avatar { display: grid; place-items: center; width: 38px; height: 38px; border-radius: 11px; color: #fff; background: linear-gradient(135deg, #8062cf, #4e328f); font-weight: 800; }
    .profile strong, .profile small { display: block; }
    .profile strong { font-size: .76rem; }
    .profile small { margin-top: .12rem; color: var(--muted); font-size: .65rem; }
    .content { max-width: 1480px; padding: 2.1rem clamp(1.2rem, 3vw, 2.75rem) 3rem; }
    .mobile-nav { display: none; }
    @media (max-width: 900px) { :host { display: block; } .side { display: none; } .top { padding: 0 1rem; } .profile-copy, .divider { display: none; } .content { padding: 1.5rem 1rem 6rem; } .mobile-nav { position: fixed; z-index: 8; right: 0; bottom: 0; left: 0; display: flex; justify-content: space-around; padding: .5rem max(.4rem, env(safe-area-inset-right)) calc(.5rem + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: #fff; box-shadow: 0 -8px 24px #1f16330d; } .mobile-nav a { min-width: 56px; color: var(--muted); text-align: center; text-decoration: none; font-size: .65rem; } .mobile-nav b { display: block; margin-bottom: .15rem; color: var(--violet); font-size: 1rem; } }
    @media (max-width: 520px) { .search-wrap { width: auto; flex: 1; } .top { gap: .45rem; } .profile { padding: 0; } .icon-btn { display: none; } }
  `],
  template: `
    <aside class="side">
      <div class="brand"><span class="brand-mark">✦</span> SanctuaryAI</div>
      <div class="church"><span class="church-logo">G</span><span><small>MINISTRY WORKSPACE</small><strong>Grace Community Church</strong></span><span class="chevron">⌄</span></div>
      <nav class="nav" aria-label="Primary">
        @for (n of nav; track n.path) {
          @if (n.section) { <div class="nav-label">{{ n.section }}</div> }
          <a [routerLink]="n.path" routerLinkActive="active"><span class="nav-icon" aria-hidden="true">{{ n.icon }}</span>{{ n.label }}@if (n.badge) { <span class="nav-badge">{{ n.badge }}</span> }</a>
        }
      </nav>
      <div class="help"><span>?</span><span>Help & resources</span></div>
    </aside>
    <section class="main">
      <header class="top">
        <label class="search-wrap"><span class="search-icon">⌕</span><input class="search" aria-label="Search all ministry content" placeholder="Search anything..."></label>
        <div class="top-actions">
          <button class="icon-btn notification" aria-label="Notifications">♢</button><span class="divider"></span>
          <button class="profile" aria-label="User menu" (click)="session.logout()"><span class="profile-avatar">{{ initial() }}</span><span class="profile-copy"><strong>Pastor Kwame</strong><small>Administrator</small></span><span class="profile-copy">⌄</span></button>
        </div>
      </header>
      <main class="content"><router-outlet /></main>
    </section>
    <nav class="mobile-nav" aria-label="Mobile primary"><a routerLink="/app/dashboard"><b>⌂</b>Home</a><a routerLink="/app/campaigns"><b>◫</b>Campaigns</a><a routerLink="/app/sermons"><b>✎</b>Sermons</a><a routerLink="/app/social"><b>◎</b>Publish</a></nav>
  `,
})
export class AppShellComponent {
  readonly session = inject(SessionService);
  readonly initial = signal(this.session.user()?.name.charAt(0).toUpperCase() ?? 'K');
  readonly nav: NavItem[] = [
    { label: 'Dashboard', icon: '⌂', path: '/app/dashboard', section: 'Overview' },
    { label: 'Monthly Campaigns', icon: '◫', path: '/app/campaigns', badge: '3' },
    { label: 'Themes', icon: '✦', path: '/app/workspace/themes', section: 'Create' },
    { label: 'Sermons', icon: '✎', path: '/app/sermons' },
    { label: 'Prayer Points', icon: '♢', path: '/app/workspace/prayer-points' },
    { label: 'Declarations', icon: '◈', path: '/app/workspace/declarations' },
    { label: 'Flyer Studio', icon: '▧', path: '/app/flyer-studio' },
    { label: 'Video Studio', icon: '▶', path: '/app/workspace/videos' },
    { label: 'Content Calendar', icon: '▦', path: '/app/workspace/calendar', section: 'Publish' },
    { label: 'Social Publisher', icon: '◎', path: '/app/social' },
    { label: 'Media Library', icon: '▣', path: '/app/workspace/media' },
    { label: 'Reviews', icon: '✓', path: '/app/reviews', section: 'Manage', badge: '6' },
    { label: 'Analytics', icon: '↗', path: '/app/workspace/analytics' },
    { label: 'Team', icon: '♙', path: '/app/workspace/team' },
    { label: 'Church Settings', icon: '⚙', path: '/app/workspace/settings' },
  ];
}
