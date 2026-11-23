import { DOCUMENT } from '@angular/common';
import { HttpClient, provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CerrarSesionUseCase } from './application/cerrar-sesion.use-case';
import { GestionarInactividadUseCase } from './application/gestionar-inactividad.use-case';
import { IniciarSesionSimuladaUseCase } from './application/iniciar-sesion-simulada.use-case';
import { ListarAutorizacionesDelDiaUseCase } from './application/listar-autorizaciones-del-dia.use-case';
import { RegistrarAutorizacionUseCase } from './application/registrar-autorizacion.use-case';
import { RenovarSesionUseCase } from './application/renovar-sesion.use-case';
import {
  ACTIVIDAD_USUARIO_GATEWAY,
  AUTORIZACION_REPOSITORY,
  CERRAR_SESION,
  EMISOR_TOKEN_GATEWAY,
  GESTIONAR_INACTIVIDAD,
  INICIAR_SESION_SIMULADA,
  LISTAR_AUTORIZACIONES_DEL_DIA,
  REGISTRAR_AUTORIZACION,
  RELOJ_GATEWAY,
  RENOVAR_SESION,
  SESION_GATEWAY,
} from './di/tokens';
import { authInterceptor } from './infrastructure/http/auth.interceptor';
import { AutorizacionHttpRepository } from './infrastructure/http/autorizacion-http.repository';
import { ActividadDomGateway } from './infrastructure/dom/actividad-dom.gateway';
import { EmisorTokenHttpGateway } from './infrastructure/sesion/emisor-token-http.gateway';
import { RelojSistemaGateway } from './infrastructure/sesion/reloj-sistema.gateway';
import { SesionEnMemoriaGateway } from './infrastructure/sesion/sesion-en-memoria.gateway';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),

    { provide: SESION_GATEWAY, useFactory: () => new SesionEnMemoriaGateway() },
    { provide: RELOJ_GATEWAY, useFactory: () => new RelojSistemaGateway() },
    { provide: ACTIVIDAD_USUARIO_GATEWAY, useFactory: () => new ActividadDomGateway(inject(DOCUMENT)) },
    { provide: AUTORIZACION_REPOSITORY, useFactory: () => new AutorizacionHttpRepository(inject(HttpClient)) },
    { provide: EMISOR_TOKEN_GATEWAY, useFactory: () => new EmisorTokenHttpGateway(inject(HttpClient)) },

    {
      provide: REGISTRAR_AUTORIZACION,
      useFactory: () => new RegistrarAutorizacionUseCase(inject(AUTORIZACION_REPOSITORY)),
    },
    {
      provide: LISTAR_AUTORIZACIONES_DEL_DIA,
      useFactory: () => new ListarAutorizacionesDelDiaUseCase(inject(AUTORIZACION_REPOSITORY)),
    },
    {
      provide: INICIAR_SESION_SIMULADA,
      useFactory: () => new IniciarSesionSimuladaUseCase(inject(EMISOR_TOKEN_GATEWAY), inject(SESION_GATEWAY)),
    },
    { provide: CERRAR_SESION, useFactory: () => new CerrarSesionUseCase(inject(SESION_GATEWAY)) },
    {
      provide: GESTIONAR_INACTIVIDAD,
      useFactory: () => new GestionarInactividadUseCase(inject(RELOJ_GATEWAY), inject(ACTIVIDAD_USUARIO_GATEWAY)),
    },
    {
      provide: RENOVAR_SESION,
      useFactory: () =>
        new RenovarSesionUseCase(inject(EMISOR_TOKEN_GATEWAY), inject(SESION_GATEWAY), inject(RELOJ_GATEWAY)),
    },
  ],
};