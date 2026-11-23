export type Complejidad = 'baja' | 'alta';

export interface Servicio {
  readonly codigo: string;
  readonly nombre: string;
  readonly complejidad: Complejidad;
}