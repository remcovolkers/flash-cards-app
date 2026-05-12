import { Injectable } from '@angular/core';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class GetCardsForStudyUseCase {
  constructor(
    private flashcardRepo: FlashcardRepository,
    private storageRepo: StorageRepository,
    private leitnerRepo: LeitnerRepository,
  ) {}

  async execute(domein: string): Promise<Flashcard[]> {
    const excludedIds = new Set(this.storageRepo.getExcludedIds());
    const gradedIds = new Set(this.leitnerRepo.getAll().map((l) => l.id));
    const cards = await this.flashcardRepo.getCardsByDomein(domein);
    return cards.filter((c) => !excludedIds.has(c.id) && !gradedIds.has(c.id));
  }
}
