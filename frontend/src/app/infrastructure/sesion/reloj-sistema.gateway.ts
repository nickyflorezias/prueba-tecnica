import { RelojGateway } from '../../domain/port/reloj-gateway';

const ZONA = 'America/Bogota';

export class RelojSistemaGateway implements RelojGateway {
  ahora(): number {
    return Date.now();
  }

  hoy(): string {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: ZONA,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  }

  programar(retardoMs: number, accion: () => void): () => void {
    const id = setTimeout(accion, retardoMs);
    return () => clearTimeout(id);
  }
}