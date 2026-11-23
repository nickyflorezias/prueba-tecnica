export interface RelojGateway {
  ahora(): number;
  hoy(): string;
  programar(retardoMs: number, accion: () => void): () => void;
}