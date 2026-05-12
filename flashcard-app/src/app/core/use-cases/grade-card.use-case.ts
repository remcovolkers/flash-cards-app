import { Injectable } from '@angular/core';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { LeitnerCard, LEITNER_INTERVALS } from '../../domain/models/leitner-card.model';

@Injectable({ providedIn: 'root' })
export class GradeCardUseCase {
  constructor(private leitner: LeitnerRepository) {}

  execute(cardId: string, correct: boolean): LeitnerCard {
    const existing = this.leitner.get(cardId);
    const today = new Date().toISOString().slice(0, 10);

    let newStack: 1 | 2 | 3 | 4;
    if (!correct) {
      newStack = 1;
    } else {
      const currentStack = existing?.stack ?? 1;
      newStack = (Math.min(currentStack + 1, 4)) as 1 | 2 | 3 | 4;
    }

    const intervalDays = LEITNER_INTERVALS[newStack];
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);

    const leitnerCard: LeitnerCard = {
      id: cardId,
      stack: newStack,
      nextReviewDate: nextDate.toISOString().slice(0, 10),
      lastReviewed: today,
    };

    this.leitner.save(leitnerCard);
    return leitnerCard;
  }
}
