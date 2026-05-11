import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/chapter-select/chapter-select.component').then(
        (m) => m.ChapterSelectComponent
      ),
  },
  {
    path: 'study/:domein',
    loadComponent: () =>
      import('./features/study/study.component').then((m) => m.StudyComponent),
  },
  {
    path: 'saved',
    loadComponent: () =>
      import('./features/saved/saved.component').then((m) => m.SavedComponent),
  },
  {
    path: 'excluded',
    loadComponent: () =>
      import('./features/excluded/excluded.component').then(
        (m) => m.ExcludedComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
