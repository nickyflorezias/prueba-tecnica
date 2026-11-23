import { ActividadUsuarioGateway } from '../../domain/port/actividad-usuario-gateway';

const EVENTOS = ['keydown', 'pointerdown', 'pointermove', 'wheel', 'focusin', 'click'] as const;
const INTERVALO_MS = 1000;

export class ActividadDomGateway implements ActividadUsuarioGateway {
  constructor(
    private readonly destino: Document,
    private readonly ahora: () => number = () => Date.now(),
  ) {}

  escuchar(alActividad: () => void): () => void {
    let ultima = Number.NEGATIVE_INFINITY;
    const manejador = (): void => {
      const t = this.ahora();
      if (t - ultima < INTERVALO_MS) return;
      ultima = t;
      alActividad();
    };
    EVENTOS.forEach((e) => this.destino.addEventListener(e, manejador, { passive: true, capture: true }));
    return () => EVENTOS.forEach((e) => this.destino.removeEventListener(e, manejador, { capture: true }));
  }
}