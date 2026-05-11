import { Injectable } from '@angular/core';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { Chapter } from '../../domain/models/chapter.model';

@Injectable({ providedIn: 'root' })
export class GetChaptersUseCase {
  constructor(private repo: FlashcardRepository) {}

  execute(): Promise<Chapter[]> {
    return this.repo.getChapters();
  }
}
