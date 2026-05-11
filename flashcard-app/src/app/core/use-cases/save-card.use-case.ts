import { Injectable } from '@angular/core';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class SaveCardUseCase {
  constructor(private storageRepo: StorageRepository) {}

  execute(card: Flashcard): void {
    this.storageRepo.saveCard(card);
  }
}
