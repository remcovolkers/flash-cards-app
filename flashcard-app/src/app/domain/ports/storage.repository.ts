import { Flashcard } from '../models/flashcard.model';

export abstract class StorageRepository {
  abstract getSavedCards(): Flashcard[];
  abstract saveCard(card: Flashcard): void;
  abstract removeSavedCard(id: string): void;
  abstract getExcludedIds(): string[];
  abstract excludeCard(id: string): void;
  abstract removeExcludedId(id: string): void;
  abstract getProgress(chapterName: string): number | null;
  abstract saveProgress(chapterName: string, index: number): void;
  abstract clearProgress(chapterName: string): void;
}
