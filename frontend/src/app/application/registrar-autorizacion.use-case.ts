import { SolicitudInvalidaError } from '../domain/error/errores-dominio';
import { ResultadoRegistro } from '../domain/model/resultado-registro';
import { SolicitudAutorizacion } from '../domain/model/solicitud-autorizacion';
import { AutorizacionRepository } from '../domain/port/autorizacion-repository';
import { validarSolicitud } from '../domain/rules/validacion-solicitud';

export class RegistrarAutorizacionUseCase {
  constructor(private readonly repositorio: AutorizacionRepository) {}

  async ejecutar(solicitud: SolicitudAutorizacion): Promise<ResultadoRegistro> {
    const errores = validarSolicitud(solicitud);
    if (errores.length > 0) throw new SolicitudInvalidaError(errores);
    return this.repositorio.registrar({
      documento: solicitud.documento.trim(),
      codigoServicio: solicitud.codigoServicio.trim(),
      cantidad: solicitud.cantidad.trim(),
    });
  }
}