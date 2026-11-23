export interface ActividadUsuarioGateway {
  escuchar(alActividad: () => void): () => void;
}