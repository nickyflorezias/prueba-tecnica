import { PaginaAutorizaciones } from '../model/pagina-autorizaciones';
import { ResultadoRegistro } from '../model/resultado-registro';
import { SolicitudAutorizacion } from '../model/solicitud-autorizacion';

export interface AutorizacionRepository {
  registrar(solicitud: SolicitudAutorizacion): Promise<ResultadoRegistro>;
  listarDelDia(fecha: string, pagina: number, tamano: number): Promise<PaginaAutorizaciones>;
}