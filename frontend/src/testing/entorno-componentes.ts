import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';
import { CerrarSesionUseCase } from '../app/application/cerrar-sesion.use-case';
import { GestionarInactividadUseCase } from '../app/application/gestionar-inactividad.use-case';
import { IniciarSesionSimuladaUseCase } from '../app/application/iniciar-sesion-simulada.use-case';
import { ListarAutorizacionesDelDiaUseCase } from '../app/application/listar-autorizaciones-del-dia.use-case';
import { RegistrarAutorizacionUseCase } from '../app/application/registrar-autorizacion.use-case';
import { RenovarSesionUseCase } from '../app/application/renovar-sesion.use-case';
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
} from '../app/di/tokens';
import { ActividadFalsa, EmisorFalso, RelojFalso, RepositorioFalso, SesionGatewayFalso } from './dobles';

export interface Entorno {
  readonly proveedores: Array<Provider | EnvironmentProviders>;
  readonly repositorio: RepositorioFalso;
  readonly sesiones: SesionGatewayFalso;
  readonly actividad: ActividadFalsa;
  readonly emisor: EmisorFalso;
}

export function crearEntorno(): Entorno {
  const repositorio = new RepositorioFalso();
  const sesiones = new SesionGatewayFalso();
  const reloj = new RelojFalso();
  const actividad = new ActividadFalsa();
  const emisor = new EmisorFalso();
  const proveedores: Array<Provider | EnvironmentProviders> = [
    provideRouter([{ path: '**', children: [] }]),
    { provide: AUTORIZACION_REPOSITORY, useValue: repositorio },
    { provide: SESION_GATEWAY, useValue: sesiones },
    { provide: RELOJ_GATEWAY, useValue: reloj },
    { provide: ACTIVIDAD_USUARIO_GATEWAY, useValue: actividad },
    { provide: EMISOR_TOKEN_GATEWAY, useValue: emisor },
    { provide: REGISTRAR_AUTORIZACION, useValue: new RegistrarAutorizacionUseCase(repositorio) },
    { provide: LISTAR_AUTORIZACIONES_DEL_DIA, useValue: new ListarAutorizacionesDelDiaUseCase(repositorio) },
    { provide: INICIAR_SESION_SIMULADA, useValue: new IniciarSesionSimuladaUseCase(emisor, sesiones) },
    { provide: CERRAR_SESION, useValue: new CerrarSesionUseCase(sesiones) },
    { provide: GESTIONAR_INACTIVIDAD, useValue: new GestionarInactividadUseCase(reloj, actividad) },
    { provide: RENOVAR_SESION, useValue: new RenovarSesionUseCase(emisor, sesiones, reloj) },
  ];
  return { proveedores, repositorio, sesiones, actividad, emisor };
}