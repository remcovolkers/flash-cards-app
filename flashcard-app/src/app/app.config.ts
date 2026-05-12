import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { FlashcardRepository } from './domain/ports/flashcard.repository';
import { StorageRepository } from './domain/ports/storage.repository';
import { LeitnerRepository } from './domain/ports/leitner.repository';
import { FlashcardDataRepository } from './data/flashcard-data.repository';
import { StorageDataRepository } from './data/storage-data.repository';
import { LeitnerDataRepository } from './data/leitner-data.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
    { provide: FlashcardRepository, useClass: FlashcardDataRepository },
    { provide: StorageRepository, useClass: StorageDataRepository },
    { provide: LeitnerRepository, useClass: LeitnerDataRepository },
  ],
};
