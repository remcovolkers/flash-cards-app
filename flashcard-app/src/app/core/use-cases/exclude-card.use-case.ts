import { Injectable } from '@angular/core';
import { StorageRepository } from '../../domain/ports/storage.repository';

@Injectable({ providedIn: 'root' })
export class ExcludeCardUseCase {
  constructor(private storageRepo: StorageRepository) {}

  execute(id: string): void {
    this.storageRepo.excludeCard(id);
  }
}
