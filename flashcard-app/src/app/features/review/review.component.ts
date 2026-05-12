import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GetDueCardsUseCase } from '../../core/use-cases/get-due-cards.use-case';
import { GradeCardUseCase } from '../../core/use-cases/grade-card.use-case';
import { SaveCardUseCase } from '../../core/use-cases/save-card.use-case';
import { ExcludeCardUseCase } from '../../core/use-cases/exclude-card.use-case';
import { LeitnerRepository } from '../../domain/ports/leitner.repository';
import { LeitnerCard } from '../../domain/models/leitner-card.model';
import { Flashcard } from '../../domain/models/flashcard.model';

type SwipeAction = 'correct' | 'incorrect' | 'save' | null;

interface SessionStats {
  correct: number;
  incorrect: number;
  incorrectCards: { card: Flashcard; nextReviewDate: string }[];
  allGraded: { card: Flashcard; correct: boolean; nextReviewDate: string }[];
}

interface UndoState {
  cardIndex: number;
  card: Flashcard;
  wasCorrect: boolean;
  previousLeitner: LeitnerCard | null;
}

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review.component.html',
  styleUrl: './review.component.scss',
})
export class ReviewComponent implements OnInit {
  cards: Flashcard[] = [];
  currentIndex = signal(0);
  isFlipped = signal(false);
  loading = true;
  done = false;
  sessionStats: SessionStats = { correct: 0, incorrect: 0, incorrectCards: [], allGraded: [] };
  undoStack: UndoState[] = [];

  feedback = signal<SwipeAction>(null);
  dragOffsetX = signal(0);
  dragOffsetY = signal(0);

  private touchStartX = 0;
  private touchStartY = 0;
  private lastSwipeTime = 0;
  private readonly TAP_THRESHOLD = 12;
  private readonly SWIPE_THRESHOLD = 50;

  constructor(
    private router: Router,
    private getDueCards: GetDueCardsUseCase,
    private gradeCardUseCase: GradeCardUseCase,
    private saveCardUseCase: SaveCardUseCase,
    private excludeCardUseCase: ExcludeCardUseCase,
    private leitnerRepo: LeitnerRepository,
    private elRef: ElementRef<HTMLElement>,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.cards = await this.getDueCards.execute();
      if (this.cards.length === 0) this.done = true;
    } catch (err) {
      console.error('Fout bij laden van herhaalkaarten:', err);
      this.done = true;
    } finally {
      this.loading = false;
    }
  }

  get current(): Flashcard | null {
    return this.cards[this.currentIndex()] ?? null;
  }

  get progress(): number {
    if (this.cards.length === 0) return 100;
    return Math.round((this.currentIndex() / this.cards.length) * 100);
  }

  // ── Touch ────────────────────────────────────────────────────────────────

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent): void {
    if (!this.isFlipped()) return;
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dragOffsetX.set(dx);
      this.dragOffsetY.set(0);
    }
  }

  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    this.dragOffsetX.set(0);
    this.dragOffsetY.set(0);
    this.handleSwipe(dx, dy);
  }

  // ── Mouse ────────────────────────────────────────────────────────────────

  private mouseDown = false;
  private mouseStartX = 0;
  private mouseStartY = 0;

  onMouseDown(e: MouseEvent): void {
    this.mouseDown = true;
    this.mouseStartX = e.clientX;
    this.mouseStartY = e.clientY;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent): void {
    if (!this.mouseDown || !this.isFlipped()) return;
    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dragOffsetX.set(dx);
      this.dragOffsetY.set(0);
    }
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(e: MouseEvent): void {
    if (!this.mouseDown) return;
    this.mouseDown = false;
    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    this.dragOffsetX.set(0);
    this.dragOffsetY.set(0);
    this.handleSwipe(dx, dy);
  }

  // ── Swipe logic ───────────────────────────────────────────────────────────

  onCardClick(): void {
    if (Date.now() - this.lastSwipeTime < 500) return;
    this.flipCard();
  }

  private handleSwipe(dx: number, dy: number): void {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const total = Math.max(absDx, absDy);
    if (total < this.TAP_THRESHOLD) return;

    if (this.isFlipped()) {
      if (absDx >= absDy && absDx >= this.SWIPE_THRESHOLD) {
        this.lastSwipeTime = Date.now();
        if (dx > 0) {
          this.triggerAction('correct');
          this.gradeCard(true);
        } else {
          this.triggerAction('incorrect');
          this.gradeCard(false);
        }
      }
    }
    // Not flipped: swipe does nothing — tap/click to flip only
  }

  protected triggerAction(action: SwipeAction): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(18);
    }
    this.feedback.set(action);
    setTimeout(() => this.feedback.set(null), 600);
  }

  flipCard(): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    this.isFlipped.update((v) => !v);
  }

  gradeCard(correct: boolean): void {
    if (!this.current) return;
    const card = this.current;
    const previousLeitner = this.leitnerRepo.get(card.id);
    const result = this.gradeCardUseCase.execute(card.id, correct);
    this.undoStack.push({ cardIndex: this.currentIndex(), card, wasCorrect: correct, previousLeitner });
    if (correct) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.incorrect++;
      this.sessionStats.incorrectCards.push({ card, nextReviewDate: result.nextReviewDate });
    }
    this.sessionStats.allGraded.push({ card, correct, nextReviewDate: result.nextReviewDate });
    this.advance();
  }

  undoLastGrade(): void {
    const entry = this.undoStack.pop();
    if (!entry) return;
    const { cardIndex, card, wasCorrect, previousLeitner } = entry;
    if (previousLeitner) {
      this.leitnerRepo.save(previousLeitner);
    }
    if (wasCorrect) {
      this.sessionStats.correct = Math.max(0, this.sessionStats.correct - 1);
    } else {
      this.sessionStats.incorrect = Math.max(0, this.sessionStats.incorrect - 1);
      this.sessionStats.incorrectCards = this.sessionStats.incorrectCards.filter((i) => i.card.id !== card.id);
    }
    this.sessionStats.allGraded = this.sessionStats.allGraded.filter((i) => i.card.id !== card.id);
    this.currentIndex.set(cardIndex);
    this.isFlipped.set(true);
    this.done = false;
    this.resetCardScroll();
  }

  canUndoCard(cardId: string): boolean {
    return this.undoStack.some((u) => u.card.id === cardId);
  }

  undoSpecificCard(cardId: string): void {
    const idx = this.undoStack.findIndex((u) => u.card.id === cardId);
    if (idx === -1) return;
    const [entry] = this.undoStack.splice(idx, 1);
    if (entry.previousLeitner) this.leitnerRepo.save(entry.previousLeitner);
    if (entry.wasCorrect) {
      this.sessionStats.correct = Math.max(0, this.sessionStats.correct - 1);
    } else {
      this.sessionStats.incorrect = Math.max(0, this.sessionStats.incorrect - 1);
      this.sessionStats.incorrectCards = this.sessionStats.incorrectCards.filter((i) => i.card.id !== cardId);
    }
    this.sessionStats.allGraded = this.sessionStats.allGraded.filter((i) => i.card.id !== cardId);
    this.currentIndex.set(entry.cardIndex);
    this.isFlipped.set(true);
    this.done = false;
    this.resetCardScroll();
  }

  masterCard(cardId: string): void {
    const graded = this.sessionStats.allGraded.find((i) => i.card.id === cardId);
    this.excludeCardUseCase.execute(cardId);
    this.sessionStats.allGraded = this.sessionStats.allGraded.filter((i) => i.card.id !== cardId);
    this.sessionStats.incorrectCards = this.sessionStats.incorrectCards.filter((i) => i.card.id !== cardId);
    this.undoStack = this.undoStack.filter((u) => u.card.id !== cardId);
    if (graded) {
      if (graded.correct) this.sessionStats.correct = Math.max(0, this.sessionStats.correct - 1);
      else this.sessionStats.incorrect = Math.max(0, this.sessionStats.incorrect - 1);
    }
  }

  get gradedByDate(): { label: string; date: string; items: { card: Flashcard; correct: boolean; nextReviewDate: string }[] }[] {
    const groups = new Map<string, { card: Flashcard; correct: boolean; nextReviewDate: string }[]>();
    for (const item of this.sessionStats.allGraded) {
      if (!groups.has(item.nextReviewDate)) groups.set(item.nextReviewDate, []);
      groups.get(item.nextReviewDate)!.push(item);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ label: this.dateLabel(date), date, items }));
  }

  private dateLabel(dateStr: string): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) return 'Morgen';
    if (diffDays === 7) return 'Over 1 week';
    if (diffDays === 14) return 'Over 2 weken';
    return `Over ${diffDays} dagen`;
  }

  private advance(): void {
    this.isFlipped.set(false);
    if (this.currentIndex() < this.cards.length - 1) {
      this.currentIndex.update((i) => i + 1);
    } else {
      this.done = true;
    }
    this.resetCardScroll();
  }

  saveForLater(): void {
    if (this.current) {
      this.saveCardUseCase.execute(this.current);
      this.triggerAction('save');
    }
    this.advance();
  }

  private resetCardScroll(): void {
    setTimeout(() => {
      const faces = this.elRef.nativeElement.querySelectorAll<HTMLElement>('.card-face');
      faces.forEach((el) => (el.scrollTop = 0));
    }, 0);
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  get cardTransform(): string {
    const x = this.dragOffsetX();
    const y = this.dragOffsetY();
    return `translate(${x}px, ${y}px) rotate(${x * 0.05}deg)`;
  }

  get dragClass(): string {
    const x = this.dragOffsetX();
    if (!this.isFlipped() || Math.abs(x) < 20) return '';
    return x > 0 ? 'drag-correct' : 'drag-incorrect';
  }
}
