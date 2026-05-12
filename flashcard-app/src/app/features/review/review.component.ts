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
import { Flashcard } from '../../domain/models/flashcard.model';

type SwipeAction = 'correct' | 'incorrect' | 'save' | null;

interface SessionStats {
  correct: number;
  incorrect: number;
  incorrectCards: { card: Flashcard; nextReviewDate: string }[];
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
  sessionStats: SessionStats = { correct: 0, incorrect: 0, incorrectCards: [] };

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
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;
    if (this.isFlipped()) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.dragOffsetX.set(dx);
        this.dragOffsetY.set(0);
      }
      return;
    }
    this.dragOffsetX.set(dx);
    this.dragOffsetY.set(dy);
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
    if (!this.mouseDown) return;
    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    if (this.isFlipped()) {
      if (Math.abs(dx) > Math.abs(dy)) {
        this.dragOffsetX.set(dx);
        this.dragOffsetY.set(0);
      }
      return;
    }
    this.dragOffsetX.set(dx);
    this.dragOffsetY.set(dy);
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
      return;
    }
    if (total >= this.SWIPE_THRESHOLD) {
      this.lastSwipeTime = Date.now();
      this.flipCard();
    }
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
    const result = this.gradeCardUseCase.execute(card.id, correct);
    if (correct) {
      this.sessionStats.correct++;
    } else {
      this.sessionStats.incorrect++;
      this.sessionStats.incorrectCards.push({ card, nextReviewDate: result.nextReviewDate });
    }
    this.advance();
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
