import { MotivoCierre, Sesion } from '../../domain/model/sesion';
import { EscuchaSesion, SesionGateway } from '../../domain/port/sesion-gateway';

export class SesionEnMemoriaGateway implements SesionGateway {
  private sesion: Sesion | null = null;
  private readonly escuchas = new Set<EscuchaSesion>();

  obtener(): Sesion | null {
    return this.sesion;
  }

  establecer(sesion: Sesion): void {
    this.sesion = sesion;
    this.avisar(sesion);
  }

  limpiar(motivo: MotivoCierre): void {
    this.sesion = null;
    this.avisar(null, motivo);
  }

  suscribir(escucha: EscuchaSesion): () => void {
    this.escuchas.add(escucha);
    return () => this.escuchas.delete(escucha);
  }

  private avisar(sesion: Sesion | null, motivo?: MotivoCierre): void {
    this.escuchas.forEach((escucha) => escucha(sesion, motivo));
  }
}