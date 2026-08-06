import { Component, computed, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { SessionService } from "../services/session.service";
import type { Permission } from "../models/domain.models";

interface NavItem {
  label: string;
  icon: string;
  path: string;
  section?: string;
  badge?: string;
  permission?: Permission;
}

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
      }
      .menu-trigger {
        position: fixed;
        z-index: 12;
        top: 16px;
        left: 16px;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        padding: 0;
        border: 1px solid #ffffff26;
        border-radius: 11px;
        color: #fff;
        background: #21163e;
        box-shadow: 0 6px 18px #170d3240;
        transition:
          background 0.15s,
          transform 0.15s;
      }
      .menu-trigger:hover,
      .menu-trigger:focus-visible,
      .menu-trigger[aria-expanded="true"] {
        background: #5d3eb0;
        transform: translateY(-1px);
      }
      .burger {
        position: relative;
        width: 19px;
        height: 14px;
        border-top: 2px solid currentColor;
        border-bottom: 2px solid currentColor;
      }
      .burger::after {
        content: "";
        position: absolute;
        top: 4px;
        left: 0;
        width: 19px;
        border-top: 2px solid currentColor;
      }
      .side {
        position: fixed;
        z-index: 11;
        top: 0;
        left: 0;
        display: flex;
        flex-direction: column;
        width: 252px;
        height: 100vh;
        padding: 1.5rem 1rem 1rem;
        overflow: auto;
        color: #d9d2eb;
        background: linear-gradient(180deg, #21163e 0%, #1a1233 100%);
        box-shadow: 10px 0 30px #170d3226;
        transform: translateX(-100%);
        visibility: hidden;
        transition:
          transform 0.22s ease,
          visibility 0.22s;
      }
      .menu-trigger:hover + .side,
      .menu-trigger:focus-visible + .side,
      .side:hover,
      .side:focus-within,
      .side.open {
        transform: translateX(0);
        visibility: visible;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin: 0 0.55rem 1.65rem 3.25rem;
        color: #fff;
        font-size: 1.15rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        white-space: nowrap;
      }
      .brand-logo {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        box-shadow: 0 6px 16px #0003;
      }
      .church {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.75rem;
        margin-bottom: 1.15rem;
        border: 1px solid #ffffff12;
        border-radius: 12px;
        background: #ffffff0a;
      }
      .church-logo {
        display: grid;
        place-items: center;
        width: 34px;
        height: 34px;
        flex: 0 0 auto;
        border-radius: 9px;
        color: #2c1d59;
        background: #f0b966;
        font-weight: 900;
      }
      .church small {
        display: block;
        margin-bottom: 0.15rem;
        color: #978cae;
        font-size: 0.62rem;
      }
      .church strong {
        display: block;
        overflow: hidden;
        color: #f7f5fc;
        font-size: 0.75rem;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .chevron {
        margin-left: auto;
        color: #8e83a6;
      }
      .nav {
        display: grid;
      }
      .nav-label {
        margin: 1rem 0.75rem 0.42rem;
        color: #786d91;
        font-size: 0.61rem;
        font-weight: 800;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }
      .nav a {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        min-height: 39px;
        padding: 0.55rem 0.7rem;
        border-radius: 9px;
        color: #bdb5d0;
        text-decoration: none;
        font-size: 0.78rem;
        font-weight: 550;
        transition:
          color 0.15s,
          background 0.15s;
      }
      .nav a:hover {
        color: #fff;
        background: #ffffff0b;
      }
      .nav a.active {
        color: #fff;
        background: linear-gradient(90deg, #694ab7, #5a3ea0);
        box-shadow: 0 6px 16px #110a2460;
      }
      .nav-icon {
        width: 20px;
        text-align: center;
        color: #a99ec2;
        font-size: 0.95rem;
      }
      .nav a.active .nav-icon {
        color: #fff;
      }
      .nav-badge {
        margin-left: auto;
        min-width: 20px;
        padding: 0.15rem 0.35rem;
        border-radius: 999px;
        color: #fff;
        background: #e05e69;
        text-align: center;
        font-size: 0.6rem;
        font-weight: 800;
      }
      .help {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-top: auto;
        padding: 0.8rem;
        border-top: 1px solid #ffffff10;
        color: #a69dbb;
        font-size: 0.74rem;
      }
      .main {
        min-width: 0;
      }
      .top {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 0.85rem;
        height: 72px;
        padding: 0 2rem 0 5rem;
        border-bottom: 1px solid var(--line);
        background: #ffffffeb;
        backdrop-filter: blur(12px);
      }
      .search-wrap {
        position: relative;
        width: min(460px, 48vw);
      }
      .search-icon {
        position: absolute;
        left: 0.85rem;
        top: 50%;
        color: #8c93a1;
        transform: translateY(-50%);
      }
      .search {
        width: 100%;
        padding: 0.68rem 1rem 0.68rem 2.4rem;
        border: 1px solid #e3e3e9;
        border-radius: 10px;
        outline: none;
        color: var(--ink);
        background: #f8f8fa;
        font-size: 0.8rem;
      }
      .search:focus {
        border-color: #b9ace0;
        box-shadow: 0 0 0 3px #eee9fa;
      }
      .top-actions {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-left: auto;
      }
      .icon-btn {
        position: relative;
        color: #555d6d;
      }
      .notification::after {
        content: "";
        position: absolute;
        right: 8px;
        top: 7px;
        width: 6px;
        height: 6px;
        border: 2px solid white;
        border-radius: 50%;
        background: #dd5260;
      }
      .divider {
        width: 1px;
        height: 30px;
        margin: 0 0.2rem;
        background: var(--line);
      }
      .profile {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        border: 0;
        color: var(--ink);
        background: transparent;
        text-align: left;
      }
      .profile-avatar {
        display: grid;
        place-items: center;
        width: 38px;
        height: 38px;
        border-radius: 11px;
        color: #fff;
        background: linear-gradient(135deg, #8062cf, #4e328f);
        font-weight: 800;
      }
      .profile strong,
      .profile small {
        display: block;
      }
      .profile strong {
        font-size: 0.76rem;
      }
      .profile small {
        margin-top: 0.12rem;
        color: var(--muted);
        font-size: 0.65rem;
      }
      .content {
        max-width: 1480px;
        padding: 2.1rem clamp(1.2rem, 3vw, 2.75rem) 3rem;
      }
      .mobile-nav {
        display: none;
      }
      @media (max-width: 900px) {
        .top {
          padding: 0 1rem 0 4.6rem;
        }
        .profile-copy,
        .divider {
          display: none;
        }
        .content {
          padding: 1.5rem 1rem 6rem;
        }
        .mobile-nav {
          position: fixed;
          z-index: 8;
          right: 0;
          bottom: 0;
          left: 0;
          display: flex;
          justify-content: space-around;
          padding: 0.5rem max(0.4rem, env(safe-area-inset-right))
            calc(0.5rem + env(safe-area-inset-bottom));
          border-top: 1px solid var(--line);
          background: #fff;
          box-shadow: 0 -8px 24px #1f16330d;
        }
        .mobile-nav a {
          min-width: 56px;
          color: var(--muted);
          text-align: center;
          text-decoration: none;
          font-size: 0.65rem;
        }
        .mobile-nav b {
          display: block;
          margin-bottom: 0.15rem;
          color: var(--violet);
          font-size: 1rem;
        }
      }
      @media (max-width: 520px) {
        .search-wrap {
          width: auto;
          flex: 1;
        }
        .top {
          gap: 0.45rem;
        }
        .profile {
          padding: 0;
        }
        .icon-btn {
          display: none;
        }
      }
    `,
  ],
  template: `
    <button
      class="menu-trigger"
      type="button"
      aria-label="Show or hide navigation menu"
      aria-controls="primary-menu"
      [attr.aria-expanded]="menuOpen()"
      (click)="menuOpen.set(!menuOpen())"
      (mouseenter)="menuOpen.set(true)"
    >
      <span class="burger" aria-hidden="true"></span>
    </button>
    <aside
      id="primary-menu"
      class="side"
      [class.open]="menuOpen()"
      (mouseenter)="menuOpen.set(true)"
      (mouseleave)="menuOpen.set(false)"
    >
      <div class="brand">
        <img
          class="brand-logo"
          src="/inverselogo.png"
          alt=""
          width="50"
          height="50"
          aria-hidden="true"
        />
        SanctuaryAI
      </div>
      <div class="church">
        <span class="church-logo">{{ session.organizationInitial() }}</span
        ><span
          ><small>MINISTRY WORKSPACE</small
          ><strong>{{ session.organizationName() }}</strong></span
        ><span class="chevron">⌄</span>
      </div>
      <nav class="nav" aria-label="Primary">
        @for (n of visibleNav(); track n.path) {
          @if (n.section) {
            <div class="nav-label">{{ n.section }}</div>
          }
          <a [routerLink]="n.path" routerLinkActive="active"
            ><span class="nav-icon" aria-hidden="true">{{ n.icon }}</span
            >{{ n.label }}
            @if (n.badge) {
              <span class="nav-badge">{{ n.badge }}</span>
            }
          </a>
        }
      </nav>
      <div class="help"><span>?</span><span>Help & resources</span></div>
    </aside>
    <section class="main">
      <header class="top">
        <label class="search-wrap"
          ><span class="search-icon">⌕</span
          ><input
            class="search"
            aria-label="Search all ministry content"
            placeholder="Search anything..."
        /></label>
        <div class="top-actions">
          <button class="icon-btn notification" aria-label="Notifications">
            ♢</button
          ><span class="divider"></span>
          <button
            class="profile"
            aria-label="User menu"
            (click)="session.logout()"
          >
            <span class="profile-avatar">{{ session.profileInitial() }}</span
            ><span class="profile-copy"
              ><strong>{{ session.profileName() }}</strong
              ><small>{{ session.profileEmail() }}</small></span
            ><span class="profile-copy">⌄</span>
          </button>
        </div>
      </header>
      <main class="content"><router-outlet /></main>
    </section>
    <nav class="mobile-nav" aria-label="Mobile primary">
      <a routerLink="/app/dashboard"><b>⌂</b>Home</a
      ><a routerLink="/app/monthly-campaigns"><b>◫</b>Campaigns</a
      ><a routerLink="/app/sermons"><b>✎</b>Sermons</a
      ><a routerLink="/app/social-publisher"><b>◎</b>Publish</a>
    </nav>
  `,
})
export class AppShellComponent {
  readonly session = inject(SessionService);
  readonly menuOpen = signal(false);
  readonly nav: readonly NavItem[] = [
    {
      label: "Dashboard",
      icon: "⌂",
      path: "/app/dashboard",
      section: "Overview",
    },
    {
      label: "Monthly Campaigns",
      icon: "◫",
      path: "/app/monthly-campaigns",
    },
    {
      label: "Themes",
      icon: "✦",
      path: "/app/themes",
      section: "Create",
    },
    {
      label: "Sermons",
      icon: "✎",
      path: "/app/sermons",
      permission: "sermons.create",
    },
    { label: "Prayer Points", icon: "♢", path: "/app/prayer-points" },
    { label: "Declarations", icon: "◈", path: "/app/declarations" },
    {
      label: "Flyer Studio",
      icon: "▧",
      path: "/app/flyer-studio",
      permission: "flyers.edit",
    },
    { label: "Video Studio", icon: "▶", path: "/app/video-studio" },
    {
      label: "Content Calendar",
      icon: "▦",
      path: "/app/content-calendar",
      section: "Publish",
    },
    {
      label: "Social Publisher",
      icon: "◎",
      path: "/app/social-publisher",
      permission: "social.schedule",
    },
    { label: "Media Library", icon: "▣", path: "/app/media-library" },
    {
      label: "Reviews",
      icon: "✓",
      path: "/app/reviews",
      section: "Manage",
    },
    { label: "Analytics", icon: "↗", path: "/app/analytics" },
    {
      label: "Team",
      icon: "♙",
      path: "/app/team-management",
      permission: "users.manage",
    },
    {
      label: "Church Settings",
      icon: "⚙",
      path: "/app/settings",
      permission: "settings.manage",
    },
  ];
  readonly visibleNav = computed(() =>
    this.nav.filter(
      (item) => !item.permission || this.session.can(item.permission),
    ),
  );
}
