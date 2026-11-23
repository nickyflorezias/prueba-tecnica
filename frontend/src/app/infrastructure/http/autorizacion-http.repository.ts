import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AseguradoNoEncontradoError,
  EnCarenciaError,
  ErrorDeRedError,
  ErrorInesperadoError,
  SesionExpiradaError,
  SinPermisoError,
  SolicitudInvalidaError,
} from '../../domain/error/errores-dominio';
import { PaginaAutorizaciones } from '../../domain/model/pagina-autorizaciones';
import { ResultadoRegistro } from '../../domain/model/resultado-registro';
import { SolicitudAutorizacion } from '../../domain/model/solicitud-autorizacion';
import { AutorizacionRepository } from '../../domain/port/autorizacion-repository';
import {
  AutorizacionDto,
  ErrorNegocioDto,
  ErroresDto,
  ListaAutorizacionesDto,
} from './autorizacion.dto';
import { aAutorizacion, aPagina, aRequestDto } from './autorizacion.mapper';

const RECURSO = '/api/v1/autorizaciones';

export class AutorizacionHttpRepository implements AutorizacionRepository {
  constructor(private readonly http: HttpClient) {}

  async registrar(solicitud: SolicitudAutorizacion): Promise<ResultadoRegistro> {
    try {
      const dto = await firstValueFrom(this.http.post<AutorizacionDto>(RECURSO, aRequestDto(solicitud)));
      return { autorizacion: aAutorizacion(dto) };
    } catch (error) {
      throw traducir(error);
    }
  }

  async listarDelDia(fecha: string, pagina: number, tamano: number): Promise<PaginaAutorizaciones> {
    const params = new HttpParams().set('fecha', fecha).set('pagina', pagina).set('tamano', tamano);
    try {
      const dto = await firstValueFrom(this.http.get<ListaAutorizacionesDto>(RECURSO, { params }));
      return aPagina(dto);
    } catch (error) {
      throw traducir(error);
    }
  }
}

export function traducir(error: unknown): Error {
  if (!(error instanceof HttpErrorResponse)) return new ErrorInesperadoError();
  const cuerpo = (error.error ?? {}) as ErroresDto & ErrorNegocioDto;
  switch (error.status) {
    case 0:
      return new ErrorDeRedError();
    case 400:
      return new SolicitudInvalidaError(
        Array.isArray(cuerpo.errores)
          ? cuerpo.errores
          : [{ campo: 'cuerpo', mensaje: 'La solicitud no es válida' }],
      );
    case 401:
      return new SesionExpiradaError();
    case 403:
      return new SinPermisoError();
    case 404:
      return new AseguradoNoEncontradoError(cuerpo.mensaje);
    case 409:
      return cuerpo.disponible_desde
        ? new EnCarenciaError(cuerpo.disponible_desde, cuerpo.mensaje)
        : new ErrorInesperadoError();
    default:
      return new ErrorInesperadoError();
  }
}