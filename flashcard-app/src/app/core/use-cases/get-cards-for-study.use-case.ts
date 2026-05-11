import { Injectable } from '@angular/core';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class GetCardsForStudyUseCase {
  constructor(
    private flashcardRepo: FlashcardRepository,
    private storageRepo: StorageRepository
  ) {}

  async execute(domein: string): Promise<Flashcard[]> {
    const excludedIds = this.storageRepo.getExcludedIds();
    const cards = await this.flashcardRepo.getCardsByDomein(domein);
    return cards.filter((c) => !excludedIds.includes(c.id));
  }
}
