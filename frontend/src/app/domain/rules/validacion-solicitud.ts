import { ErrorCampo } from '../model/error-campo';
import { SolicitudAutorizacion } from '../model/solicitud-autorizacion';
import { TARIFARIO_SEDE_IPS_0412 } from './tarifario-sede-ips-0412';

export const CAMPO_DOCUMENTO = 'documento_asegurado';
export const CAMPO_SERVICIO = 'codigo_servicio';
export const CAMPO_CANTIDAD = 'cantidad';
export const CAMPO_CUERPO = 'cuerpo';

const PATRON_DOCUMENTO = /^\d{6,10}$/;
const PATRON_DIGITOS = /^\d+$/;
const PATRON_ENTERO = /^\d{1,3}$/;
const CANTIDAD_MINIMA = 1;
const CANTIDAD_MAXIMA = 10;

export function validarDocumento(valor: string | null | undefined): string | null {
  const texto = (valor ?? '').trim();
  if (texto === '') return 'El documento es obligatorio';
  if (!PATRON_DOCUMENTO.test(texto)) return 'El documento debe tener entre 6 y 10 dígitos';
  return null;
}

export function validarServicio(valor: string | null | undefined): string | null {
  const texto = (valor ?? '').trim();
  if (texto === '') return 'El código de servicio es obligatorio';
  if (!PATRON_DIGITOS.test(texto)) return 'El código de servicio solo admite dígitos';
  if (!TARIFARIO_SEDE_IPS_0412.some((s) => s.codigo === texto)) {
    return `El servicio ${texto} no está en el tarifario de la sede`;
  }
  return null;
}

export function validarCantidad(valor: string | number | null | undefined): string | null {
  const texto = (valor ?? '').toString().trim();
  if (texto === '') return 'La cantidad es obligatoria';
  const mensaje = 'La cantidad debe ser un entero entre 1 y 10';
  if (!PATRON_ENTERO.test(texto)) return mensaje;
  const numero = Number(texto);
  if (numero < CANTIDAD_MINIMA || numero > CANTIDAD_MAXIMA) return mensaje;
  return null;
}

export function validarSolicitud(solicitud: SolicitudAutorizacion): ErrorCampo[] {
  const revisiones: ReadonlyArray<readonly [string, string | null]> = [
    [CAMPO_DOCUMENTO, validarDocumento(solicitud.documento)],
    [CAMPO_SERVICIO, validarServicio(solicitud.codigoServicio)],
    [CAMPO_CANTIDAD, validarCantidad(solicitud.cantidad)],
  ];
  return revisiones.flatMap(([campo, mensaje]) => (mensaje ? [{ campo, mensaje }] : []));
}