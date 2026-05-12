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
  `],
})
export class App implements OnInit {
  updateAvailable = signal(false);

  constructor(private swUpdate: SwUpdate) {}

  ngOnInit(): void {
    if (!this.swUpdate.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateAvailable.set(true));
  }

  applyUpdate(): void {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
