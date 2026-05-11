import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { FlashcardRepository } from '../../domain/ports/flashcard.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Component({
  selector: 'app-excluded',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excluded.component.html',
  styleUrl: './excluded.component.scss',
})
export class ExcludedComponent implements OnInit {
  excludedCards: Flashcard[] = [];
  loading = true;

  constructor(
    private storageRepo: StorageRepository,
    private flashcardRepo: FlashcardRepository,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    const ids = this.storageRepo.getExcludedIds();
    if (ids.length === 0) {
      this.loading = false;
      return;
    }
    const all = await this.flashcardRepo.getAllCards();
    this.excludedCards = all.filter((c) => ids.includes(c.id));
    this.loading = false;
  }

  restore(id: string): void {
    this.storageRepo.removeExcludedId(id);
    this.excludedCards = this.excludedCards.filter((c) => c.id !== id);
  }

  clearAll(): void {
    for (const card of this.excludedCards) {
      this.storageRepo.removeExcludedId(card.id);
    }
    this.excludedCards = [];
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
