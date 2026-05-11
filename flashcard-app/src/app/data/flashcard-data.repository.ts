import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FlashcardRepository } from '../domain/ports/flashcard.repository';
import { Flashcard } from '../domain/models/flashcard.model';
import { Chapter } from '../domain/models/chapter.model';

interface FlashcardFile {
  metadata: unknown;
  flashcards: Flashcard[];
}

@Injectable({ providedIn: 'root' })
export class FlashcardDataRepository extends FlashcardRepository {
  private cards: Flashcard[] | null = null;

  private readonly sources = [
    '/portaal_flashcards_deel1.json',
    '/portaal_flashcards_deel2.json',
    '/portaal_flashcards_deel3.json',
  ];

  constructor(private http: HttpClient) {
    super();
  }

  private async load(): Promise<Flashcard[]> {
    if (this.cards) return this.cards;

    const results = await Promise.all(
      this.sources.map((src) =>
        firstValueFrom(this.http.get<FlashcardFile>(src))
      )
    );

    this.cards = results.flatMap((file) => file.flashcards ?? []);
    return this.cards;
  }

  async getAllCards(): Promise<Flashcard[]> {
    return this.load();
  }

  async getCardsByDomein(domein: string): Promise<Flashcard[]> {
    const all = await this.load();
    return all.filter((c) => c.domein === domein);
  }

  async getChapters(): Promise<Chapter[]> {
    const all = await this.load();
    const map = new Map<string, number>();
    for (const card of all) {
      map.set(card.domein, (map.get(card.domein) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, cardCount]) => ({ name, cardCount }));
  }
}
