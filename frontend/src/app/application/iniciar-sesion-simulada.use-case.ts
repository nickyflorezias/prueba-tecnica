import { PerfilSesion, Sesion } from '../domain/model/sesion';
import { EmisorTokenGateway } from '../domain/port/emisor-token-gateway';
import { SesionGateway } from '../domain/port/sesion-gateway';

export class IniciarSesionSimuladaUseCase {
  constructor(
    private readonly emisor: EmisorTokenGateway,
    private readonly sesiones: SesionGateway,
  ) {}

  async ejecutar(perfil: PerfilSesion): Promise<Sesion> {
    const sesion = await this.emisor.emitir(perfil);
    this.sesiones.establecer(sesion);
    return sesion;
  }
}