import { Injectable } from '@angular/core';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class GetSavedCardsUseCase {
  constructor(private storageRepo: StorageRepository) {}

  execute(): Flashcard[] {
    return this.storageRepo.getSavedCards();
  }
}
