import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetSavedCardsUseCase } from '../../core/use-cases/get-saved-cards.use-case';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

@Component({
  selector: 'app-saved',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './saved.component.html',
  styleUrl: './saved.component.scss',
})
export class SavedComponent implements OnInit {
  cards: Flashcard[] = [];
  expandedId: string | null = null;

  constructor(
    private getSavedCards: GetSavedCardsUseCase,
    private storageRepo: StorageRepository,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cards = this.getSavedCards.execute();
  }

  toggleCard(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  removeCard(id: string): void {
    this.storageRepo.removeSavedCard(id);
    this.cards = this.cards.filter((c) => c.id !== id);
    if (this.expandedId === id) this.expandedId = null;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
