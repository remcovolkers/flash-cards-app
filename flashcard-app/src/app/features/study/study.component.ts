import {
  Component,
  OnInit,
  HostListener,
  ElementRef,
  ViewChild,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GetCardsForStudyUseCase } from '../../core/use-cases/get-cards-for-study.use-case';
import { SaveCardUseCase } from '../../core/use-cases/save-card.use-case';
import { ExcludeCardUseCase } from '../../core/use-cases/exclude-card.use-case';
import { StorageRepository } from '../../domain/ports/storage.repository';
import { Flashcard } from '../../domain/models/flashcard.model';

type SwipeAction = 'next' | 'save' | 'exclude' | null;

@Component({
  selector: 'app-study',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './study.component.html',
  styleUrl: './study.component.scss',
})
export class StudyComponent implements OnInit {
  @ViewChild('cardEl') cardEl!: ElementRef<HTMLDivElement>;

  cards: Flashcard[] = [];
  currentIndex = signal(0);
  isFlipped = signal(false);
  loading = true;
  done = false;
  chapterName = '';
  showResumeDialog = false;
  resumeIndex = 0;

  feedback = signal<SwipeAction>(null);
  dragOffsetX = signal(0);
  dragOffsetY = signal(0);

  private touchStartX = 0;
  private touchStartY = 0;
  private lastSwipeTime = 0;
  private readonly TAP_THRESHOLD = 12;
  private readonly SWIPE_THRESHOLD = 50;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private getCardsUseCase: GetCardsForStudyUseCase,
    private saveCard: SaveCardUseCase,
    private excludeCard: ExcludeCardUseCase,
    private storage: StorageRepository
  ) {}

  async ngOnInit(): Promise<void> {
    const encoded = this.route.snapshot.paramMap.get('domein') ?? '';
    this.chapterName = decodeURIComponent(encoded);
    try {
      this.cards = await this.getCardsUseCase.execute(this.chapterName);
      if (this.cards.length === 0) {
        this.done = true;
      } else {
        const saved = this.storage.getProgress(this.chapterName);
        if (saved !== null && saved > 0 && saved < this.cards.length) {
          this.resumeIndex = saved;
          this.showResumeDialog = true;
        }
      }
    } catch (err) {
      console.error('Fout bij laden van kaarten:', err);
      this.done = true;
    } finally {
      this.loading = false;
    }
  }

  resumeFromSaved(): void {
    this.currentIndex.set(this.resumeIndex);
    this.showResumeDialog = false;
  }

  startFromBeginning(): void {
    this.storage.clearProgress(this.chapterName);
    this.showResumeDialog = false;
  }

  get current(): Flashcard | null {
    return this.cards[this.currentIndex()] ?? null;
  }

  get progress(): number {
    if (this.cards.length === 0) return 100;
    return Math.round((this.currentIndex() / this.cards.length) * 100);
  }

  // ── Touch handlers ───────────────────────────────────────────────────────

  onTouchStart(e: TouchEvent): void {
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
  }

  onTouchMove(e: TouchEvent): void {
    if (this.isFlipped()) return; // allow native scroll on flipped card
    const dx = e.touches[0].clientX - this.touchStartX;
    const dy = e.touches[0].clientY - this.touchStartY;
    this.dragOffsetX.set(dx);
    this.dragOffsetY.set(dy);
  }

  onTouchEnd(e: TouchEvent): void {
    const dx = e.changedTouches[0].clientX - this.touchStartX;
    const dy = e.changedTouches[0].clientY - this.touchStartY;
    this.dragOffsetX.set(0);
    this.dragOffsetY.set(0);
    if (this.isFlipped()) return; // no swipe when flipped
    this.handleSwipe(dx, dy);
  }

  // ── Mouse drag (desktop testing) ────────────────────────────────────────

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
    if (this.isFlipped()) return; // allow scroll on flipped card
    this.dragOffsetX.set(e.clientX - this.mouseStartX);
    this.dragOffsetY.set(e.clientY - this.mouseStartY);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(e: MouseEvent): void {
    if (!this.mouseDown) return;
    this.mouseDown = false;
    const dx = e.clientX - this.mouseStartX;
    const dy = e.clientY - this.mouseStartY;
    this.dragOffsetX.set(0);
    this.dragOffsetY.set(0);
    if (this.isFlipped()) return; // no swipe when flipped
    this.handleSwipe(dx, dy);
  }

  // ── Swipe logic ──────────────────────────────────────────────────────────

  onCardClick(): void {
    // Suppress synthetic click that fires after a touch swipe
    if (Date.now() - this.lastSwipeTime < 500) return;
    this.flipCard();
  }

  private handleSwipe(dx: number, dy: number): void {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const total = Math.max(absDx, absDy);

    if (total < this.TAP_THRESHOLD) {
      // Tap — let the (click) event handle it
      return;
    }

    if (total < this.SWIPE_THRESHOLD) return; // ambiguous drag, ignore

    this.lastSwipeTime = Date.now();

    if (absDx >= absDy) {
      // Horizontal
      if (dx > 0) {
        this.triggerAction('next');
        this.nextCard();
      } else {
        this.triggerAction('exclude');
        this.excludeCurrentCard();
      }
    } else {
      // Vertical — only up = save; down = nothing
      if (dy < 0) {
        this.triggerAction('save');
        this.saveForLater();
      }
    }
  }

  private triggerAction(action: SwipeAction): void {
    this.vibrate(18);
    this.feedback.set(action);
    setTimeout(() => this.feedback.set(null), 600);
  }

  private vibrate(ms = 18): void {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(ms);
    }
  }

  flipCard(): void {
    this.vibrate(10);
    this.isFlipped.update((v) => !v);
  }

  nextCard(): void {
    this.isFlipped.set(false);
    if (this.currentIndex() < this.cards.length - 1) {
      this.currentIndex.update((i) => i + 1);
      this.storage.saveProgress(this.chapterName, this.currentIndex());
    } else {
      this.storage.clearProgress(this.chapterName);
      this.done = true;
    }
  }

  prevCard(): void {
    if (this.currentIndex() > 0) {
      this.isFlipped.set(false);
      this.currentIndex.update((i) => i - 1);
      this.storage.saveProgress(this.chapterName, this.currentIndex());
    }
  }

  saveForLater(): void {
    if (this.current) {
      this.saveCard.execute(this.current);
    }
    this.nextCard();
  }

  excludeCurrentCard(): void {
    if (this.current) {
      this.excludeCard.execute(this.current.id);
      this.cards = this.cards.filter((_, i) => i !== this.currentIndex());
      if (this.currentIndex() >= this.cards.length) {
        if (this.cards.length === 0) {
          this.done = true;
          return;
        }
        this.currentIndex.set(this.cards.length - 1);
      }
      this.isFlipped.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  restart(): void {
    this.storage.clearProgress(this.chapterName);
    this.currentIndex.set(0);
    this.isFlipped.set(false);
    this.done = false;
  }

  get cardTransform(): string {
    const x = this.dragOffsetX();
    const y = this.dragOffsetY();
    const rotate = x * 0.05;
    return `translate(${x}px, ${y}px) rotate(${rotate}deg)`;
  }

  get dragClass(): string {
    const x = this.dragOffsetX();
    const y = this.dragOffsetY();
    if (Math.abs(x) < 20 && Math.abs(y) < 20) return '';
    const absDx = Math.abs(x);
    const absDy = Math.abs(y);
    if (absDx >= absDy) return x > 0 ? 'drag-right' : 'drag-left';
    return y < 0 ? 'drag-up' : '';
  }
}
