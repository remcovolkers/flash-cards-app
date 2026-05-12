import { Injectable } from '@angular/core';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { Flashcard } from '../../domain/models/flashcard.model';
import { LeitnerCard } from '../../domain/models/leitner-card.model';

export interface GradedCard {
  flashcard: Flashcard;
  leitner: LeitnerCard;
  lastGradeCorrect: boolean; // stack > 1 = correct, stack === 1 = incorrect
}

@Injectable({ providedIn: 'root' })
export class GetGradedCardsUseCase {
  constructor(
    private leitnerRepo: LeitnerRepository,
    private flashcardRepo: FlashcardRepository
  ) {}

  async execute(): Promise<GradedCard[]> {
    const leitnerCards = this.leitnerRepo.getAll();
    if (leitnerCards.length === 0) return [];

    const idSet = new Set(leitnerCards.map((l) => l.id));
    const allFlashcards = await this.flashcardRepo.getAllCards();
    const flashcardMap = new Map<string, Flashcard>(
      allFlashcards.filter((f) => idSet.has(f.id)).map((f) => [f.id, f])
    );

    return leitnerCards
      .filter((l) => flashcardMap.has(l.id))
      .map((l) => ({
        flashcard: flashcardMap.get(l.id)!,
        leitner: l,
        lastGradeCorrect: l.stack > 1,
      }))
      .sort((a, b) => b.leitner.lastReviewed.localeCompare(a.leitner.lastReviewed));
  }
}
