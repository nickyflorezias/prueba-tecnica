import { MotivoCierre, Sesion } from '../model/sesion';

export type EscuchaSesion = (sesion: Sesion | null, motivo?: MotivoCierre) => void;

export interface SesionGateway {
  obtener(): Sesion | null;
  establecer(sesion: Sesion): void;
  limpiar(motivo: MotivoCierre): void;
  suscribir(escucha: EscuchaSesion): () => void;
}