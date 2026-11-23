import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SesionFacade } from './sesion.facade';

export const sesionGuard: CanActivateFn = () => {
  const sesion = inject(SesionFacade);
  return sesion.activa() ? true : inject(Router).createUrlTree(['/entrada']);
};