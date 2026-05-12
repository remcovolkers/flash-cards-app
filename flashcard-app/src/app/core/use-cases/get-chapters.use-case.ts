import { Injectable } from '@angular/core';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { Chapter } from '../../domain/models/chapter.model';

@Injectable({ providedIn: 'root' })
export class GetChaptersUseCase {
  constructor(
    private repo: FlashcardRepository,
    private storage: StorageRepository,
    private leitner: LeitnerRepository,
  ) {}

  async execute(): Promise<Chapter[]> {
    const [chapters, allCards] = await Promise.all([
      this.repo.getChapters(),
      this.repo.getAllCards(),
    ]);

    const excludedIds = new Set(this.storage.getExcludedIds());
    const gradedIds = new Set(this.leitner.getAll().map((l) => l.id));

    // Count excluded + graded cards per domein
    const removedPerDomein = new Map<string, number>();
    for (const card of allCards) {
      if (excludedIds.has(card.id) || gradedIds.has(card.id)) {
        removedPerDomein.set(card.domein, (removedPerDomein.get(card.domein) ?? 0) + 1);
      }
    }

    return chapters.map((ch) => {
      const removed = removedPerDomein.get(ch.name) ?? 0;
      return removed > 0
        ? { ...ch, cardCount: Math.max(0, ch.totalCardCount - removed) }
        : ch;
    });
  }
}
