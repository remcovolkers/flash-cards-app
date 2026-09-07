import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  template: `
    <div class="update-banner" *ngIf="updateAvailable()">
      <span>🎉 Er is een update beschikbaar!</span>
      <button (click)="applyUpdate()">Vernieuwen</button>
    </div>
    <div class="support-banner" *ngIf="showSupportBanner()">
      <span class="support-banner__text">
        ☕ Deze app wordt met liefde onderhouden. Vind je hem handig? Een kleine traktatie wordt supergewaardeerd!
      </span>
      <div class="support-banner__actions">
        <a class="support-banner__cta" href="https://paypal.me/v0lky1" target="_blank" rel="noopener noreferrer">Trakteer me op een koffie</a>
        <button class="support-banner__dismiss" (click)="dismissSupportBanner()" aria-label="Sluiten">✕</button>
      </div>
    </div>
    <router-outlet />
  `,
  styles: [`
    .update-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.65rem 1rem;
      background: #4f46e5;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);

      button {
        flex-shrink: 0;
        background: #fff;
        color: #4f46e5;
        border: none;
        border-radius: 8px;
        padding: 0.35rem 0.85rem;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
      }
    }

    .support-banner {
      position: sticky;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: #fff7ed;
      border-bottom: 1px solid #fdba74;
      color: #7c2d12;
      font-size: 0.85rem;
    }

    .support-banner__text {
      flex: 1 1 auto;
      min-width: 200px;
      text-align: center;
    }

    .support-banner__actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .support-banner__cta {
      background: #f97316;
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 0.3rem 0.85rem;
      font-size: 0.8rem;
      font-weight: 600;
      text-decoration: none;
      white-space: nowrap;
    }

    .support-banner__cta:hover {
      background: #ea580c;
    }

    .support-banner__dismiss {
      background: transparent;
      border: none;
      color: #7c2d12;
      font-size: 0.9rem;
      line-height: 1;
      cursor: pointer;
      padding: 0.2rem 0.35rem;
      border-radius: 6px;
    }

    .support-banner__dismiss:hover {
      background: rgba(124, 45, 18, 0.1);
    }
  `],
})
export class App implements OnInit {
  updateAvailable = signal(false);
  showSupportBanner = signal(false);

  private readonly supportBannerDismissedKey = 'support-banner-dismissed';

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit(): void {
    this.showSupportBanner.set(sessionStorage.getItem(this.supportBannerDismissedKey) !== 'true');

    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));
  }

  applyUpdate(): void {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }

  dismissSupportBanner(): void {
    this.showSupportBanner.set(false);
    sessionStorage.setItem(this.supportBannerDismissedKey, 'true');
  }
}
