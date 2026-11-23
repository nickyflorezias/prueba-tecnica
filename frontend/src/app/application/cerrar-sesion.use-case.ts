import { MotivoCierre } from '../domain/model/sesion';
import { SesionGateway } from '../domain/port/sesion-gateway';

export class CerrarSesionUseCase {
  constructor(private readonly sesiones: SesionGateway) {}

  ejecutar(motivo: MotivoCierre): void {
    if (this.sesiones.obtener() === null) return;
    this.sesiones.limpiar(motivo);
  }
}