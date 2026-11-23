import { TARIFARIO_SEDE_IPS_0412 } from './tarifario-sede-ips-0412';
import {
  validarCantidad,
  validarDocumento,
  validarServicio,
  validarSolicitud,
} from './validacion-solicitud';

describe('validación de la solicitud (mensajes del servidor)', () => {
  it('documento obligatorio', () => {
    expect(validarDocumento('')).toBe('El documento es obligatorio');
    expect(validarDocumento('   ')).toBe('El documento es obligatorio');
  });

  it.each(['12345', '12345678901', '4387652a', '43 876 521'])('documento inválido %s', (valor) => {
    expect(validarDocumento(valor)).toBe('El documento debe tener entre 6 y 10 dígitos');
  });

  it.each(['123456', '43876521', '1234567890'])('documento válido %s', (valor) => {
    expect(validarDocumento(valor)).toBeNull();
  });

  it('servicio obligatorio, solo dígitos y del tarifario', () => {
    expect(validarServicio('')).toBe('El código de servicio es obligatorio');
    expect(validarServicio('88a101')).toBe('El código de servicio solo admite dígitos');
    expect(validarServicio('999999')).toBe('El servicio 999999 no está en el tarifario de la sede');
    TARIFARIO_SEDE_IPS_0412.forEach((s) => expect(validarServicio(s.codigo)).toBeNull());
  });

  it('cantidad obligatoria y entero entre 1 y 10', () => {
    expect(validarCantidad('')).toBe('La cantidad es obligatoria');
    expect(validarCantidad(null)).toBe('La cantidad es obligatoria');
    for (const malo of ['0', '11', '1.5', '-1', 'abc', '1e1']) {
      expect(validarCantidad(malo)).toBe('La cantidad debe ser un entero entre 1 y 10');
    }
    for (const bueno of ['1', '10', 5]) expect(validarCantidad(bueno)).toBeNull();
  });

  it('agrupa errores por campo en snake_case', () => {
    expect(validarSolicitud({ documento: '1', codigoServicio: '', cantidad: '0' }).map((e) => e.campo)).toEqual([
      'documento_asegurado',
      'codigo_servicio',
      'cantidad',
    ]);
    expect(validarSolicitud({ documento: '43876521', codigoServicio: '883101', cantidad: '1' })).toEqual([]);
  });

  it('el tarifario contiene los cuatro servicios de la sede', () => {
    expect(TARIFARIO_SEDE_IPS_0412.map((s) => s.codigo)).toEqual(['890201', '890264', '931000', '883101']);
    expect(TARIFARIO_SEDE_IPS_0412.find((s) => s.codigo === '883101')?.complejidad).toBe('alta');
  });
});