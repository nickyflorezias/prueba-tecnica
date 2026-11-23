import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Rol } from '../../domain/model/rol';
import { ErrorDeRedError, EnCarenciaError, AseguradoNoEncontradoError, SolicitudInvalidaError } from '../../domain/error/errores-dominio';
import { SesionFacade } from '../state/sesion.facade';
import { formatearPesos } from '../format/formatos';
import { PantallaAutorizacionesPage } from '../pages/pantalla-autorizaciones.page';
import { crearEntorno, Entorno } from '../../../testing/entorno-componentes';
import { autorizacionDePrueba, paginaDePrueba, sesionDePrueba } from '../../../testing/dobles';
import { violacionesAxe } from '../../../testing/axe';
import { DialogoInactividadComponent } from './dialogo-inactividad.component';

@Component({ selector: 'app-anfitrion-dialogo', imports: [DialogoInactividadComponent], template: '<app-dialogo-inactividad />' })
class AnfitrionDialogo {}

async function montar(entorno: Entorno, rol: Rol = 'AUXILIAR_ADMISION'): Promise<ComponentFixture<PantallaAutorizacionesPage>> {
  TestBed.configureTestingModule({ providers: entorno.proveedores });
  TestBed.inject(SesionFacade);
  entorno.sesiones.establecer(sesionDePrueba({ rol }));
  const fixture = TestBed.createComponent(PantallaAutorizacionesPage);
  fixture.autoDetectChanges();
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  await fixture.whenStable();
  return fixture;
}

function el<T extends HTMLElement>(f: ComponentFixture<unknown>, selector: string): T {
  const nodo = (f.nativeElement as HTMLElement).querySelector<T>(selector);
  if (!nodo) throw new Error(`No existe ${selector}`);
  return nodo;
}

async function escribir(f: ComponentFixture<unknown>, selector: string, valor: string): Promise<void> {
  const campo = el<HTMLInputElement | HTMLSelectElement>(f, selector);
  campo.value = valor;
  campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }));
  await f.whenStable();
}

async function enviar(f: ComponentFixture<unknown>): Promise<void> {
  el<HTMLFormElement>(f, 'form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  await f.whenStable();
}

async function llenarValido(f: ComponentFixture<unknown>): Promise<void> {
  await escribir(f, '#documento', '43876521');
  await escribir(f, '#servicio', '883101');
  await escribir(f, '#cantidad', '1');
}

describe('Pantalla de autorizaciones', () => {
  let entorno: Entorno;

  beforeEach(() => {
    entorno = crearEntorno();
  });

  it('la caja no ve el formulario pero sí la lista', async () => {
    const f = await montar(entorno, 'AUXILIAR_CAJA');
    expect(f.nativeElement.querySelector('app-formulario-autorizacion')).toBeNull();
    expect(f.nativeElement.querySelector('#documento')).toBeNull();
    expect(f.nativeElement.querySelector('app-lista-autorizaciones')).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('Auxiliar de caja');
  });

  it('el documento está enmascarado al digitar y se puede mostrar con aria-pressed', async () => {
    const f = await montar(entorno);
    const documento = el<HTMLInputElement>(f, '#documento');
    expect(documento.type).toBe('password');
    expect(documento.autocomplete).toBe('off');
    expect(documento.inputMode).toBe('numeric');
    const boton = Array.from(f.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent?.includes('Mostrar documento'),
    ) as HTMLButtonElement;
    expect(boton.getAttribute('aria-pressed')).toBe('false');
    boton.click();
    await f.whenStable();
    expect(documento.type).toBe('text');
    expect(boton.getAttribute('aria-pressed')).toBe('true');
  });

  it('un 201 muestra lo que paga cada parte, el documento enmascarado, limpia los campos y recarga la lista', async () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const f = await montar(entorno);
    const consultasAntes = entorno.repositorio.consultas.length;
    await llenarValido(f);
    await enviar(f);
    const resultado = el(f, '#resultado');
    expect(resultado.textContent).toContain('AU-000108');
    expect(resultado.textContent).toContain('XXXX6521');
    expect(resultado.textContent).not.toContain('43876521');
    expect(resultado.textContent).toContain(formatearPesos(28000));
    expect(resultado.textContent).toContain(formatearPesos(72000));
    expect(el<HTMLInputElement>(f, '#documento').value).toBe('');
    expect(el<HTMLInputElement>(f, '#cantidad').value).toBe('');
    expect(entorno.repositorio.consultas.length).toBeGreaterThan(consultasAntes);
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe('');
    expect(sessionStorage.length + localStorage.length).toBe(0);
  });

  it('errores del servidor por campo: marca el campo, enfoca y conserva lo digitado', async () => {
    entorno.repositorio.alRegistrar = async () => {
      throw new SolicitudInvalidaError([
        { campo: 'cantidad', mensaje: 'La cantidad debe ser un entero entre 1 y 10' },
        { campo: 'cuerpo', mensaje: 'Cuerpo ilegible' },
      ]);
    };
    const f = await montar(entorno);
    await llenarValido(f);
    await enviar(f);
    const cantidad = el<HTMLInputElement>(f, '#cantidad');
    expect(cantidad.getAttribute('aria-invalid')).toBe('true');
    expect(cantidad.getAttribute('aria-describedby')).toContain('cantidad-error');
    expect(el(f, '#cantidad-error').textContent).toContain('entero entre 1 y 10');
    expect(el<HTMLInputElement>(f, '#documento').value).toBe('43876521');
    expect(el<HTMLSelectElement>(f, '#servicio').value).toBe('883101');
    expect(cantidad.value).toBe('1');
    const resumen = el(f, '#resumen-errores');
    expect(resumen.getAttribute('role')).toBe('alert');
    expect(resumen.querySelector('a[href="#cantidad"]')).not.toBeNull();
    expect(resumen.textContent).toContain('Cuerpo ilegible');
    expect(document.activeElement).toBe(cantidad);
  });

  it('404 se muestra como error del campo documento', async () => {
    entorno.repositorio.alRegistrar = async () => {
      throw new AseguradoNoEncontradoError('El documento no corresponde a un asegurado');
    };
    const f = await montar(entorno);
    await llenarValido(f);
    await enviar(f);
    expect(el<HTMLInputElement>(f, '#documento').getAttribute('aria-invalid')).toBe('true');
    expect(el(f, '#documento-error').textContent).toContain('no corresponde a un asegurado');
    expect(document.activeElement).toBe(el(f, '#documento'));
  });

  it('409 muestra desde qué fecha se puede autorizar, en español', async () => {
    entorno.repositorio.alRegistrar = async () => {
      throw new EnCarenciaError('2026-12-09', 'El asegurado está en carencia');
    };
    const f = await montar(entorno);
    await llenarValido(f);
    await enviar(f);
    expect(el(f, '#resultado').textContent).toContain('9 de diciembre de 2026');
    expect(el<HTMLInputElement>(f, '#documento').value).toBe('43876521');
  });

  it('el fallo de red se informa, conserva los datos y no reintenta el POST', async () => {
    entorno.repositorio.alRegistrar = async () => {
      throw new ErrorDeRedError();
    };
    const f = await montar(entorno);
    await llenarValido(f);
    await enviar(f);
    expect(el(f, '#resumen-errores').textContent).toContain('No hay conexión');
    expect(entorno.repositorio.registros).toHaveLength(1);
    expect(el<HTMLInputElement>(f, '#documento').value).toBe('43876521');
  });

  it('un doble clic no duplica el envío y el botón se deshabilita', async () => {
    let resolver!: () => void;
    entorno.repositorio.alRegistrar = () =>
      new Promise((ok) => {
        resolver = () => ok({ autorizacion: autorizacionDePrueba('AU-000108') });
      });
    const f = await montar(entorno);
    await llenarValido(f);
    el<HTMLFormElement>(f, 'form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    el<HTMLFormElement>(f, 'form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    f.detectChanges();
    expect(entorno.repositorio.registros).toHaveLength(1);
    expect(el<HTMLButtonElement>(f, 'button[type=submit]').disabled).toBe(true);
    resolver();
    await f.whenStable();
    expect(entorno.repositorio.registros).toHaveLength(1);
  });

  it('la validación del cliente usa los mensajes del servidor y no llama a la API', async () => {
    const f = await montar(entorno);
    await enviar(f);
    expect(el(f, '#documento-error').textContent).toContain('El documento es obligatorio');
    expect(el(f, '#cantidad-error').textContent).toContain('La cantidad es obligatoria');
    expect(entorno.repositorio.registros).toHaveLength(0);
    expect(document.activeElement).toBe(el(f, '#documento'));
  });

  it('los totales mostrados son los del servidor aunque las filas sumen otra cosa', async () => {
    entorno.repositorio.alListar = async () =>
      paginaDePrueba([autorizacionDePrueba('AU-1', 100), autorizacionDePrueba('AU-2', 200)], 41);
    const f = await montar(entorno, 'AUXILIAR_CAJA');
    const texto = (f.nativeElement as HTMLElement).textContent ?? '';
    expect(texto).toContain(formatearPesos(999_999));
    expect(texto).toContain(formatearPesos(123_456));
    expect(texto).toContain('41');
    expect(texto).not.toContain(formatearPesos(300));
    expect(f.nativeElement.querySelectorAll('tbody tr')).toHaveLength(2);
    expect(f.nativeElement.querySelector('caption').textContent).toContain('IPS-0412');
  });

  it('avisa si el total cambió al cambiar de página y pagina de 50 en 50', async () => {
    let total = 120;
    entorno.repositorio.alListar = async (_f, pagina) =>
      paginaDePrueba([autorizacionDePrueba(`AU-${pagina}`)], total, pagina);
    const f = await montar(entorno, 'AUXILIAR_CAJA');
    expect(f.nativeElement.querySelector('nav[aria-label]')).not.toBeNull();
    expect(el(f, 'button[aria-current=page]').textContent?.trim()).toBe('1');
    total = 121;
    const siguiente = Array.from(f.nativeElement.querySelectorAll('nav button')).find((b) =>
      (b as HTMLElement).textContent?.includes('Siguiente'),
    ) as HTMLButtonElement;
    siguiente.click();
    await f.whenStable();
    expect(entorno.repositorio.consultas.at(-1)).toEqual({ fecha: '2026-11-19', pagina: 2, tamano: 50 });
    expect(el(f, '.aviso').textContent).toContain('Pulse Refrescar');
    expect(el(f, '.aviso').getAttribute('aria-live')).toBe('polite');
  });

  it('al cerrar la sesión se borran el resultado, la lista y el token', async () => {
    entorno.repositorio.alListar = async () => paginaDePrueba([autorizacionDePrueba('AU-1')]);
    const f = await montar(entorno);
    await llenarValido(f);
    await enviar(f);
    const sesion = TestBed.inject(SesionFacade);
    sesion.cerrar();
    await f.whenStable();
    expect(entorno.sesiones.obtener()).toBeNull();
    expect(sesion.activa()).toBe(false);
    const { AutorizacionesFacade } = await import('../state/autorizaciones.facade');
    const facade = TestBed.inject(AutorizacionesFacade);
    expect(facade.resultado()).toBeNull();
    expect(facade.items()).toEqual([]);
    expect(facade.resumen()).toBeNull();
  });

  it('axe: formulario con errores, resultado y tabla sin violaciones', async () => {
    entorno.repositorio.alListar = async () => paginaDePrueba([autorizacionDePrueba('AU-1')], 60);
    const f = await montar(entorno);
    await enviar(f);
    expect(await violacionesAxe(f.nativeElement)).toEqual([]);
    await llenarValido(f);
    await enviar(f);
    expect(await violacionesAxe(f.nativeElement)).toEqual([]);
  });
});

describe('Diálogo de inactividad', () => {
  it('es un alertdialog con foco inicial en "Seguir trabajando", Escape continúa y no tiene violaciones axe', async () => {
    const entorno = crearEntorno();
    TestBed.configureTestingModule({ providers: entorno.proveedores });
    const sesion = TestBed.inject(SesionFacade);
    entorno.sesiones.establecer(sesionDePrueba());
    sesion.avisoInactividad.set(true);
    const f = TestBed.createComponent(AnfitrionDialogo);
    f.autoDetectChanges();
    await f.whenStable();
    await new Promise((r) => setTimeout(r, 20));
    const dialogo = el(f, '[role=alertdialog]');
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(dialogo.getAttribute('aria-labelledby')).toBe('dialogo-titulo');
    expect(document.activeElement?.textContent).toContain('Seguir trabajando');
    expect(await violacionesAxe(f.nativeElement)).toEqual([]);
    dialogo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(sesion.avisoInactividad()).toBe(false);
  });
});