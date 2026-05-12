export interface Chapter {
  name: string;
  cardCount: number;      // remaining (not graded, not excluded)
  totalCardCount: number; // raw total from source JSON
  hoofdstuk?: number;
  isBonus?: boolean;
}
