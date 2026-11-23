import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { CERRAR_SESION, SESION_GATEWAY } from '../../di/tokens';

const PREFIJO_API = '/api/';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(PREFIJO_API)) return next(req);
  const sesiones = inject(SESION_GATEWAY);
  const cerrar = inject(CERRAR_SESION);
  const token = sesiones.obtener()?.token;
  const conCabeceras = req.clone({
    setHeaders: {
      'Cache-Control': 'no-store',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: 'no-store',
  });
  return next(conCabeceras).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) cerrar.ejecutar('no-autorizada');
      return throwError(() => error);
    }),
  );
};