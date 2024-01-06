import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadChildren: () => import('./deferred.routes'),
  },
  {
    path: '**',
    redirectTo: '',
  }
];
