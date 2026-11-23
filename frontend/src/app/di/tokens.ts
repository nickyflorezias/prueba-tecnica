import { InjectionToken } from '@angular/core';
import { CerrarSesionUseCase } from '../application/cerrar-sesion.use-case';
import { GestionarInactividadUseCase } from '../application/gestionar-inactividad.use-case';
import { IniciarSesionSimuladaUseCase } from '../application/iniciar-sesion-simulada.use-case';
import { ListarAutorizacionesDelDiaUseCase } from '../application/listar-autorizaciones-del-dia.use-case';
import { RegistrarAutorizacionUseCase } from '../application/registrar-autorizacion.use-case';
import { RenovarSesionUseCase } from '../application/renovar-sesion.use-case';
import { ActividadUsuarioGateway } from '../domain/port/actividad-usuario-gateway';
import { AutorizacionRepository } from '../domain/port/autorizacion-repository';
import { EmisorTokenGateway } from '../domain/port/emisor-token-gateway';
import { RelojGateway } from '../domain/port/reloj-gateway';
import { SesionGateway } from '../domain/port/sesion-gateway';

export const AUTORIZACION_REPOSITORY = new InjectionToken<AutorizacionRepository>('AutorizacionRepository');
export const SESION_GATEWAY = new InjectionToken<SesionGateway>('SesionGateway');
export const EMISOR_TOKEN_GATEWAY = new InjectionToken<EmisorTokenGateway>('EmisorTokenGateway');
export const RELOJ_GATEWAY = new InjectionToken<RelojGateway>('RelojGateway');
export const ACTIVIDAD_USUARIO_GATEWAY = new InjectionToken<ActividadUsuarioGateway>('ActividadUsuarioGateway');

export const REGISTRAR_AUTORIZACION = new InjectionToken<RegistrarAutorizacionUseCase>('RegistrarAutorizacionUseCase');
export const LISTAR_AUTORIZACIONES_DEL_DIA = new InjectionToken<ListarAutorizacionesDelDiaUseCase>(
  'ListarAutorizacionesDelDiaUseCase',
);
export const INICIAR_SESION_SIMULADA = new InjectionToken<IniciarSesionSimuladaUseCase>(
  'IniciarSesionSimuladaUseCase',
);
export const CERRAR_SESION = new InjectionToken<CerrarSesionUseCase>('CerrarSesionUseCase');
export const GESTIONAR_INACTIVIDAD = new InjectionToken<GestionarInactividadUseCase>('GestionarInactividadUseCase');
export const RENOVAR_SESION = new InjectionToken<RenovarSesionUseCase>('RenovarSesionUseCase');