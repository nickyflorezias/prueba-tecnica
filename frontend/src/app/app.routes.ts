import { Routes } from '@angular/router';
import { EntradaPage } from './presentation/pages/entrada.page';
import { PantallaAutorizacionesPage } from './presentation/pages/pantalla-autorizaciones.page';
import { sesionGuard } from './presentation/state/sesion.guard';

export const routes: Routes = [
  { path: 'entrada', component: EntradaPage, title: 'Ingreso · Autorizaciones' },
  {
    path: '',
    component: PantallaAutorizacionesPage,
    canActivate: [sesionGuard],
    title: 'Autorizaciones del día',
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];