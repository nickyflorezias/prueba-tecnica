import { SolicitudInvalidaError } from '../domain/error/errores-dominio';
import { EmisorFalso, RelojFalso, RepositorioFalso, SesionGatewayFalso, autorizacionDePrueba, paginaDePrueba, sesionDePrueba } from '../../testing/dobles';
import { CerrarSesionUseCase } from './cerrar-sesion.use-case';
import { IniciarSesionSimuladaUseCase } from './iniciar-sesion-simulada.use-case';
import { ListarAutorizacionesDelDiaUseCase } from './listar-autorizaciones-del-dia.use-case';
import { RegistrarAutorizacionUseCase } from './registrar-autorizacion.use-case';
import { RenovarSesionUseCase } from './renovar-sesion.use-case';

describe('RegistrarAutorizacionUseCase', () => {
  it('no llama al repositorio si la validación falla', async () => {
    const repo = new RepositorioFalso();
    const caso = new RegistrarAutorizacionUseCase(repo);
    const error = await caso.ejecutar({ documento: '12', codigoServicio: '000', cantidad: '99' }).catch((e) => e);
    expect(error).toBeInstanceOf(SolicitudInvalidaError);
    expect((error as SolicitudInvalidaError).errores).toHaveLength(3);
    expect(repo.registros).toHaveLength(0);
  });

  it('valida y luego registra con los datos recortados', async () => {
    const repo = new RepositorioFalso();
    const resultado = await new RegistrarAutorizacionUseCase(repo).ejecutar({
      documento: ' 43876521 ',
      codigoServicio: '883101',
      cantidad: '1',
    });
    expect(repo.registros).toEqual([{ documento: '43876521', codigoServicio: '883101', cantidad: '1' }]);
    expect(resultado.autorizacion.id).toBe('AU-000108');
  });
});

describe('ListarAutorizacionesDelDiaUseCase', () => {
  it('pide 50 por página y deduplica por id sin tocar los totales', async () => {
    const repo = new RepositorioFalso();
    repo.alListar = async () =>
      paginaDePrueba([autorizacionDePrueba('AU-1'), autorizacionDePrueba('AU-1'), autorizacionDePrueba('AU-2')], 41);
    const pagina = await new ListarAutorizacionesDelDiaUseCase(repo).ejecutar('2026-11-19', 2);
    expect(repo.consultas).toEqual([{ fecha: '2026-11-19', pagina: 2, tamano: 50 }]);
    expect(pagina.items.map((a) => a.id)).toEqual(['AU-1', 'AU-2']);
    expect(pagina.resumen.total).toBe(41);
  });
});

describe('sesión', () => {
  it('iniciar guarda la sesión emitida y cerrar la borra con su motivo', async () => {
    const sesiones = new SesionGatewayFalso();
    const emisor = new EmisorFalso();
    await new IniciarSesionSimuladaUseCase(emisor, sesiones).ejecutar('caja-0412');
    expect(emisor.emisiones).toEqual(['caja-0412']);
    expect(sesiones.obtener()?.token).toBe('token-de-prueba');

    const motivos: Array<string | undefined> = [];
    sesiones.suscribir((_s, motivo) => motivos.push(motivo));
    const cerrar = new CerrarSesionUseCase(sesiones);
    cerrar.ejecutar('inactividad');
    cerrar.ejecutar('manual');
    expect(sesiones.obtener()).toBeNull();
    expect(motivos).toEqual(['inactividad']);
  });

  describe('renovación deslizante', () => {
    function preparar(restanteMs: number) {
      const reloj = new RelojFalso(1_000_000);
      const sesiones = new SesionGatewayFalso();
      const emisor = new EmisorFalso();
      sesiones.sesion = sesionDePrueba({ expiraEn: reloj.ahora() + restanteMs, perfil: 'caja-0412' });
      emisor.siguiente = sesionDePrueba({ expiraEn: reloj.ahora() + 180_000, token: 'nuevo' });
      return { caso: new RenovarSesionUseCase(emisor, sesiones, reloj), sesiones, emisor };
    }

    it('renueva con el mismo perfil si quedan menos de 60 s', async () => {
      const { caso, sesiones, emisor } = preparar(59_999);
      expect(await caso.ejecutar()).toBe(true);
      expect(emisor.emisiones).toEqual(['caja-0412']);
      expect(sesiones.obtener()?.token).toBe('nuevo');
    });

    it('no renueva si quedan 60 s o más', async () => {
      const { caso, emisor } = preparar(60_000);
      expect(await caso.ejecutar()).toBe(false);
      expect(emisor.emisiones).toEqual([]);
    });

    it('no renueva sin sesión', async () => {
      const { caso, sesiones, emisor } = preparar(1_000);
      sesiones.sesion = null;
      expect(await caso.ejecutar()).toBe(false);
      expect(emisor.emisiones).toEqual([]);
    });
  });
});