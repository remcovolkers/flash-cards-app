import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetChaptersUseCase } from '../../core/use-cases/get-chapters.use-case';
import { GetSavedCardsUseCase } from '../../core/use-cases/get-saved-cards.use-case';
import { Chapter } from '../../domain/models/chapter.model';

@Component({
  selector: 'app-chapter-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chapter-select.component.html',
  styleUrl: './chapter-select.component.scss',
})
export class ChapterSelectComponent implements OnInit {
  chapters: Chapter[] = [];
  savedCount = 0;
  loading = true;

  constructor(
    private getChapters: GetChaptersUseCase,
    private getSavedCards: GetSavedCardsUseCase,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.chapters = await this.getChapters.execute();
      this.savedCount = this.getSavedCards.execute().length;
    } catch (err) {
      console.error('Fout bij laden van hoofdstukken:', err);
    } finally {
      this.loading = false;
    }
  }

  studyChapter(chapterName: string): void {
    this.router.navigate(['/study', encodeURIComponent(chapterName)]);
  }

  goToSaved(): void {
    this.router.navigate(['/saved']);
  }

  goToExcluded(): void {
    this.router.navigate(['/excluded']);
  }
}
