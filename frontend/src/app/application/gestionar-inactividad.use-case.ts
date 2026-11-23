import { ActividadUsuarioGateway } from '../domain/port/actividad-usuario-gateway';
import { RelojGateway } from '../domain/port/reloj-gateway';
import { AVISO_DESPUES_DE_MS, INACTIVIDAD_MS } from '../domain/rules/reglas-sesion';

export interface EscuchasInactividad {
  alAvisar(): void;
  alExpirar(): void;
  alActividad?(): void;
}

export class GestionarInactividadUseCase {
  private cancelarActividad: (() => void) | null = null;
  private cancelarAviso: (() => void) | null = null;
  private cancelarCierre: (() => void) | null = null;
  private escuchas: EscuchasInactividad | null = null;
  private avisando = false;

  constructor(
    private readonly reloj: RelojGateway,
    private readonly actividad: ActividadUsuarioGateway,
  ) {}

  iniciar(escuchas: EscuchasInactividad): void {
    this.detener();
    this.escuchas = escuchas;
    this.cancelarActividad = this.actividad.escuchar(() => {
      if (this.avisando) return;
      this.programar();
      this.escuchas?.alActividad?.();
    });
    this.programar();
  }

  continuar(): void {
    if (this.escuchas === null) return;
    this.programar();
  }

  detener(): void {
    this.cancelarActividad?.();
    this.cancelarTemporizadores();
    this.cancelarActividad = null;
    this.escuchas = null;
    this.avisando = false;
  }

  private programar(): void {
    this.cancelarTemporizadores();
    this.avisando = false;
    this.cancelarAviso = this.reloj.programar(AVISO_DESPUES_DE_MS, () => {
      this.avisando = true;
      this.escuchas?.alAvisar();
    });
    this.cancelarCierre = this.reloj.programar(INACTIVIDAD_MS, () => {
      const escuchas = this.escuchas;
      this.detener();
      escuchas?.alExpirar();
    });
  }

  private cancelarTemporizadores(): void {
    this.cancelarAviso?.();
    this.cancelarCierre?.();
    this.cancelarAviso = null;
    this.cancelarCierre = null;
  }
}