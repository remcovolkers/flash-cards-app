import { Injectable } from '@angular/core';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class GetDueCardsUseCase {
  constructor(
    private leitner: LeitnerRepository,
    private flashcard: FlashcardRepository,
  ) {}

  async execute(): Promise<Flashcard[]> {
    const dueIds = new Set(this.leitner.getDueCards().map((c) => c.id));
    if (dueIds.size === 0) return [];
    const allCards = await this.flashcard.getAllCards();
    // Shuffle so different chapters are interleaved
    const due = allCards.filter((c) => dueIds.has(c.id));
    return due.sort(() => Math.random() - 0.5);
  }
}
