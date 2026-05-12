import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FlashcardRepository } from '../domain/ports/flashcard.repository';
import { Flashcard } from '../domain/models/flashcard.model';
import { Chapter } from '../domain/models/chapter.model';

interface ChapterSection {
  naam: string;
  aantal: number;
  kaarten: Flashcard[];
}

interface FlashcardFile {
  metadata: unknown;
  flashcards: Record<string, ChapterSection>;
}

@Injectable({ providedIn: 'root' })
export class FlashcardDataRepository extends FlashcardRepository {
  private cards: Flashcard[] | null = null;

  private readonly sources = [
    '/portaal_flashcards_compleet.json',
    '/bonus_flashcards_leren.json',
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

    this.cards = results.flatMap((file) =>
      Object.values(file.flashcards).flatMap((section) => section.kaarten ?? [])
    );
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

    // Collect per-domein: card count + lowest hoofdstuk number seen
    const map = new Map<string, { cardCount: number; hoofdstuk: number }>();
    for (const card of all) {
      const existing = map.get(card.domein);
      const hNum = card.hoofdstuk ?? 999;
      if (existing) {
        existing.cardCount++;
        if (hNum < existing.hoofdstuk) existing.hoofdstuk = hNum;
      } else {
        map.set(card.domein, { cardCount: 1, hoofdstuk: hNum });
      }
    }

    const chapters: Chapter[] = Array.from(map.entries()).map(([name, { cardCount, hoofdstuk }]) => ({
      name,
      cardCount,
      hoofdstuk,
      isBonus: hoofdstuk === 0,
    }));

    // Sort: bonus (hoofdstuk 0) last, rest ascending by number
    chapters.sort((a, b) => {
      if (a.isBonus && !b.isBonus) return 1;
      if (!a.isBonus && b.isBonus) return -1;
      return (a.hoofdstuk ?? 999) - (b.hoofdstuk ?? 999);
    });

    return chapters;
  }
}
