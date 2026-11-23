import { ErrorCampo } from '../model/error-campo';

export class SolicitudInvalidaError extends Error {
  constructor(readonly errores: readonly ErrorCampo[]) {
    super('Solicitud inválida');
    this.name = 'SolicitudInvalidaError';
  }
}

export class AseguradoNoEncontradoError extends Error {
  constructor(mensaje = 'El documento no corresponde a un asegurado de la póliza') {
    super(mensaje);
    this.name = 'AseguradoNoEncontradoError';
  }
}

export class EnCarenciaError extends Error {
  constructor(
    readonly disponibleDesde: string,
    mensaje = 'El asegurado está en periodo de carencia para este servicio',
  ) {
    super(mensaje);
    this.name = 'EnCarenciaError';
  }
}

export class SesionExpiradaError extends Error {
  constructor() {
    super('La sesión no es válida o expiró');
    this.name = 'SesionExpiradaError';
  }
}

export class SinPermisoError extends Error {
  constructor() {
    super('El rol no tiene permiso para esta operación');
    this.name = 'SinPermisoError';
  }
}

export class ErrorDeRedError extends Error {
  constructor() {
    super('No hay conexión con el servidor');
    this.name = 'ErrorDeRedError';
  }
}

export class ErrorInesperadoError extends Error {
  constructor() {
    super('Error inesperado del servidor');
    this.name = 'ErrorInesperadoError';
  }
}