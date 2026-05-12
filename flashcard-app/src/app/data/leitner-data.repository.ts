import { Injectable } from '@angular/core';
import { LeitnerRepository } from '../domain/ports/leitner.repository';
import { LeitnerCard } from '../domain/models/leitner-card.model';

const LEITNER_KEY = 'fc_leitner';

@Injectable({ providedIn: 'root' })
export class LeitnerDataRepository extends LeitnerRepository {
  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private data(): Record<string, LeitnerCard> {
    const raw = localStorage.getItem(LEITNER_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, LeitnerCard>;
    } catch {
      return {};
    }
  }

  private persist(map: Record<string, LeitnerCard>): void {
    localStorage.setItem(LEITNER_KEY, JSON.stringify(map));
  }

  getAll(): LeitnerCard[] {
    return Object.values(this.data());
  }

  get(id: string): LeitnerCard | null {
    return this.data()[id] ?? null;
  }

  save(card: LeitnerCard): void {
    const map = this.data();
    map[card.id] = card;
    this.persist(map);
  }

  getDueCards(): LeitnerCard[] {
    const today = this.today();
    return this.getAll().filter((c) => c.nextReviewDate <= today);
  }

  getDueCount(): number {
    return this.getDueCards().length;
  }
}
