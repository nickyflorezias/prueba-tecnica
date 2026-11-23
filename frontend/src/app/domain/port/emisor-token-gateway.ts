import { PerfilSesion, Sesion } from '../model/sesion';

export interface EmisorTokenGateway {
  emitir(perfil: PerfilSesion): Promise<Sesion>;
}