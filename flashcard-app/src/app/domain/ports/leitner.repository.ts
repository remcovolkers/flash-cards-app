import { LeitnerCard } from '../models/leitner-card.model';

export abstract class LeitnerRepository {
  abstract getAll(): LeitnerCard[];
  abstract get(id: string): LeitnerCard | null;
  abstract save(card: LeitnerCard): void;
  abstract getDueCards(): LeitnerCard[];
  abstract getDueCount(): number;
}
