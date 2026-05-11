import { Flashcard } from '../models/flashcard.model';

export abstract class StorageRepository {
  abstract getSavedCards(): Flashcard[];
  abstract saveCard(card: Flashcard): void;
  abstract removeSavedCard(id: string): void;
  abstract getExcludedIds(): string[];
  abstract excludeCard(id: string): void;
  abstract removeExcludedId(id: string): void;
}
