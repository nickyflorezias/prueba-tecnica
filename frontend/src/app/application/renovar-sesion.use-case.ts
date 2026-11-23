import { RENOVAR_SI_QUEDA_MENOS_DE_MS } from '../domain/rules/reglas-sesion';
import { EmisorTokenGateway } from '../domain/port/emisor-token-gateway';
import { RelojGateway } from '../domain/port/reloj-gateway';
import { SesionGateway } from '../domain/port/sesion-gateway';

export class RenovarSesionUseCase {
  private renovando = false;

  constructor(
    private readonly emisor: EmisorTokenGateway,
    private readonly sesiones: SesionGateway,
    private readonly reloj: RelojGateway,
  ) {}

  async ejecutar(): Promise<boolean> {
    const actual = this.sesiones.obtener();
    if (actual === null || this.renovando) return false;
    if (actual.expiraEn - this.reloj.ahora() >= RENOVAR_SI_QUEDA_MENOS_DE_MS) return false;
    this.renovando = true;
    try {
      const nueva = await this.emisor.emitir(actual.perfil);
      if (this.sesiones.obtener() === null) return false;
      this.sesiones.establecer(nueva);
      return true;
    } finally {
      this.renovando = false;
    }
  }
}