import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetGradedCardsUseCase, GradedCard } from '../../core/use-cases/get-graded-cards.use-case';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';

type FilterMode = 'all' | 'correct' | 'incorrect';

@Component({
  selector: 'app-kaartenbak',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kaartenbak.component.html',
  styleUrl: './kaartenbak.component.scss',
})
export class KaartenbakComponent implements OnInit {
  allCards: GradedCard[] = [];
  filter: FilterMode = 'all';
  expandedId: string | null = null;
  loading = true;

  constructor(
    private getGradedCards: GetGradedCardsUseCase,
    private leitnerRepo: LeitnerRepository,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.allCards = await this.getGradedCards.execute();
    } catch (err) {
      console.error('Fout bij laden van kaartenbak:', err);
    } finally {
      this.loading = false;
    }
  }

  get filteredCards(): GradedCard[] {
    if (this.filter === 'correct') return this.allCards.filter((c) => c.lastGradeCorrect);
    if (this.filter === 'incorrect') return this.allCards.filter((c) => !c.lastGradeCorrect);
    return this.allCards;
  }

  get correctCount(): number {
    return this.allCards.filter((c) => c.lastGradeCorrect).length;
  }

  get incorrectCount(): number {
    return this.allCards.filter((c) => !c.lastGradeCorrect).length;
  }

  setFilter(mode: FilterMode): void {
    this.filter = mode;
    this.expandedId = null;
  }

  toggleCard(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  resetCard(id: string): void {
    this.leitnerRepo.remove(id);
    this.allCards = this.allCards.filter((c) => c.flashcard.id !== id);
    if (this.expandedId === id) this.expandedId = null;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
