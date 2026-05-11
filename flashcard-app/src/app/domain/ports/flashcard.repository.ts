import { Flashcard } from '../models/flashcard.model';
import { Chapter } from '../models/chapter.model';

export abstract class FlashcardRepository {
  abstract getAllCards(): Promise<Flashcard[]>;
  abstract getCardsByDomein(domein: string): Promise<Flashcard[]>;
  abstract getChapters(): Promise<Chapter[]>;
}
