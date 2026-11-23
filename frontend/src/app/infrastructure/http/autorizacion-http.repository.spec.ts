import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CerrarSesionUseCase } from '../../application/cerrar-sesion.use-case';
import { CERRAR_SESION, SESION_GATEWAY } from '../../di/tokens';
import {
  AseguradoNoEncontradoError,
  EnCarenciaError,
  ErrorDeRedError,
  ErrorInesperadoError,
  SesionExpiradaError,
  SinPermisoError,
  SolicitudInvalidaError,
} from '../../domain/error/errores-dominio';
import { SesionGatewayFalso, sesionDePrueba } from '../../../testing/dobles';
import { AutorizacionHttpRepository } from './autorizacion-http.repository';
import { AutorizacionDto } from './autorizacion.dto';
import { authInterceptor } from './auth.interceptor';

const DTO: AutorizacionDto = {
  id: 'AU-000108',
  asegurado_enmascarado: 'XXXX6521',
  servicio: { codigo: '883101', nombre: 'Resonancia magnética de columna', complejidad: 'alta' },
  cantidad: 1,
  valor: 100000,
  deducible: 20000,
  coaseguro: 8000,
  pago_asegurado: 28000,
  pago_aseguradora: 72000,
  sede: 'IPS-0412',
  fecha_hora: '2026-11-19T08:05:00-05:00',
};

const SOLICITUD = { documento: '43876521', codigoServicio: '883101', cantidad: '1' };

describe('AutorizacionHttpRepository + AuthInterceptor', () => {
  let http: HttpTestingController;
  let repo: AutorizacionHttpRepository;
  let sesiones: SesionGatewayFalso;

  beforeEach(() => {
    sesiones = new SesionGatewayFalso();
    sesiones.sesion = sesionDePrueba({ token: 'abc.def.ghi' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: SESION_GATEWAY, useValue: sesiones },
        { provide: CERRAR_SESION, useValue: new CerrarSesionUseCase(sesiones) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    repo = new AutorizacionHttpRepository(TestBed.inject(HttpClient));
  });

  afterEach(() => http.verify());

  it('envía el cuerpo en snake_case, Authorization y no-store, y mapea el 201 al dominio', async () => {
    const promesa = repo.registrar(SOLICITUD);
    const req = http.expectOne('/api/v1/autorizaciones');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ documento_asegurado: '43876521', codigo_servicio: '883101', cantidad: 1 });
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    expect(req.request.headers.get('Cache-Control')).toBe('no-store');
    expect(req.request.cache).toBe('no-store');
    req.flush(DTO, { status: 201, statusText: 'Created' });
    const { autorizacion } = await promesa;
    expect(autorizacion).toMatchObject({
      id: 'AU-000108',
      aseguradoEnmascarado: 'XXXX6521',
      pagoAsegurado: 28000,
      pagoAseguradora: 72000,
      fechaHora: '2026-11-19T08:05:00-05:00',
    });
    expect(autorizacion.servicio.complejidad).toBe('alta');
  });

  it('el listado manda fecha, pagina y tamano, y mapea los totales del servidor', async () => {
    const promesa = repo.listarDelDia('2026-11-19', 2, 50);
    const req = http.expectOne((r) => r.url === '/api/v1/autorizaciones');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.toString()).toBe('fecha=2026-11-19&pagina=2&tamano=50');
    expect(req.request.headers.get('Authorization')).toBe('Bearer abc.def.ghi');
    req.flush({
      items: [DTO],
      pagina: 2,
      tamano: 50,
      total: 41,
      valor_total: 6874300,
      recaudo_esperado: 2318400,
      calculado_en: '2026-11-19T18:40:00-05:00',
    });
    const pagina = await promesa;
    expect(pagina.resumen).toEqual({
      total: 41,
      valorTotal: 6874300,
      recaudoEsperado: 2318400,
      calculadoEn: '2026-11-19T18:40:00-05:00',
    });
    expect(pagina.items[0]?.id).toBe('AU-000108');
  });

  it('no añade el token a URLs que no son de la API', () => {
    TestBed.inject(HttpClient).get('/dev/otra').subscribe();
    const req = http.expectOne('/dev/otra');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  async function fallo(estado: number, cuerpo: object | null): Promise<unknown> {
    const promesa = repo.registrar(SOLICITUD).catch((e) => e);
    http.expectOne('/api/v1/autorizaciones').flush(cuerpo, { status: estado, statusText: 'x' });
    return promesa;
  }

  it('400 → SolicitudInvalidaError con los errores por campo', async () => {
    const error = await fallo(400, { errores: [{ campo: 'cantidad', mensaje: 'La cantidad es obligatoria' }] });
    expect(error).toBeInstanceOf(SolicitudInvalidaError);
    expect((error as SolicitudInvalidaError).errores).toEqual([
      { campo: 'cantidad', mensaje: 'La cantidad es obligatoria' },
    ]);
  });

  it('404 → AseguradoNoEncontradoError', async () => {
    const error = await fallo(404, { codigo: 'ASEGURADO_NO_ENCONTRADO', mensaje: 'No es asegurado' });
    expect(error).toBeInstanceOf(AseguradoNoEncontradoError);
    expect((error as Error).message).toBe('No es asegurado');
  });

  it('409 → EnCarenciaError con la fecha', async () => {
    const error = await fallo(409, { codigo: 'EN_CARENCIA', mensaje: 'En carencia', disponible_desde: '2026-12-09' });
    expect(error).toBeInstanceOf(EnCarenciaError);
    expect((error as EnCarenciaError).disponibleDesde).toBe('2026-12-09');
  });

  it('401 → SesionExpiradaError y cierra la sesión', async () => {
    const error = await fallo(401, null);
    expect(error).toBeInstanceOf(SesionExpiradaError);
    expect(sesiones.obtener()).toBeNull();
  });

  it('403 → SinPermisoError sin cerrar la sesión', async () => {
    const error = await fallo(403, null);
    expect(error).toBeInstanceOf(SinPermisoError);
    expect(sesiones.obtener()).not.toBeNull();
  });

  it('500 → ErrorInesperadoError', async () => {
    expect(await fallo(500, { mensaje: 'detalle interno' })).toBeInstanceOf(ErrorInesperadoError);
  });

  it('fallo de red → ErrorDeRedError y no reintenta el POST', async () => {
    const promesa = repo.registrar(SOLICITUD).catch((e) => e);
    http.expectOne('/api/v1/autorizaciones').error(new ProgressEvent('error'));
    expect(await promesa).toBeInstanceOf(ErrorDeRedError);
    http.expectNone('/api/v1/autorizaciones');
  });
});