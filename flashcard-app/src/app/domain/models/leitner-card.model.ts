export interface LeitnerCard {
  id: string;
  stack: 1 | 2 | 3 | 4;
  nextReviewDate: string; // ISO date YYYY-MM-DD
  lastReviewed: string;   // ISO date YYYY-MM-DD
}

export const LEITNER_INTERVALS: Record<1 | 2 | 3 | 4, number> = {
  1: 1,   // dagelijks
  2: 2,   // om de dag
  3: 7,   // wekelijks
  4: 14,  // tweewekelijks
};
