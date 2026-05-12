import { Injectable } from '@angular/core';
import { StorageRepository } from '../domain/ports/storage.repository';
import { Flashcard } from '../domain/models/flashcard.model';

const SAVED_KEY = 'fc_saved_cards';
const EXCLUDED_KEY = 'fc_excluded_ids';
const PROGRESS_KEY = 'fc_progress';

@Injectable({ providedIn: 'root' })
export class StorageDataRepository extends StorageRepository {
  getSavedCards(): Flashcard[] {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Flashcard[];
    } catch {
      return [];
    }
  }

  saveCard(card: Flashcard): void {
    const cards = this.getSavedCards();
    if (!cards.some((c) => c.id === card.id)) {
      cards.push(card);
      localStorage.setItem(SAVED_KEY, JSON.stringify(cards));
    }
  }

  removeSavedCard(id: string): void {
    const cards = this.getSavedCards().filter((c) => c.id !== id);
    localStorage.setItem(SAVED_KEY, JSON.stringify(cards));
  }

  getExcludedIds(): string[] {
    const raw = localStorage.getItem(EXCLUDED_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as string[];
    } catch {
      return [];
    }
  }

  excludeCard(id: string): void {
    const ids = this.getExcludedIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(EXCLUDED_KEY, JSON.stringify(ids));
    }
  }

  removeExcludedId(id: string): void {
    const ids = this.getExcludedIds().filter((i) => i !== id);
    localStorage.setItem(EXCLUDED_KEY, JSON.stringify(ids));
  }

  private progressMap(): Record<string, number> {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    try { return JSON.parse(raw) as Record<string, number>; } catch { return {}; }
  }

  getProgress(chapterName: string): number | null {
    const map = this.progressMap();
    return chapterName in map ? map[chapterName] : null;
  }

  saveProgress(chapterName: string, index: number): void {
    const map = this.progressMap();
    map[chapterName] = index;
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  }

  clearProgress(chapterName: string): void {
    const map = this.progressMap();
    delete map[chapterName];
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  }
}
