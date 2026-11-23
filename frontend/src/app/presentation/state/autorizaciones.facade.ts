import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { LISTAR_AUTORIZACIONES_DEL_DIA, REGISTRAR_AUTORIZACION, RELOJ_GATEWAY } from '../../di/tokens';
import { TAMANO_PAGINA } from '../../application/listar-autorizaciones-del-dia.use-case';
import {
  AseguradoNoEncontradoError,
  EnCarenciaError,
  ErrorDeRedError,
  SesionExpiradaError,
  SinPermisoError,
  SolicitudInvalidaError,
} from '../../domain/error/errores-dominio';
import { Autorizacion } from '../../domain/model/autorizacion';
import { ErrorCampo } from '../../domain/model/error-campo';
import { ResumenDia } from '../../domain/model/pagina-autorizaciones';
import { SolicitudAutorizacion } from '../../domain/model/solicitud-autorizacion';
import { CAMPO_DOCUMENTO } from '../../domain/rules/validacion-solicitud';
import { SesionFacade } from './sesion.facade';

export type ResultadoEnvio =
  | { tipo: 'ok' }
  | { tipo: 'ignorado' }
  | { tipo: 'campos'; errores: readonly ErrorCampo[] }
  | { tipo: 'carencia' }
  | { tipo: 'general'; mensaje: string };

export type EstadoLista = 'inactivo' | 'cargando' | 'listo' | 'error';

export interface Carencia {
  readonly disponibleDesde: string;
  readonly mensaje: string;
}

@Injectable({ providedIn: 'root' })
export class AutorizacionesFacade {
  private readonly registrarCasoDeUso = inject(REGISTRAR_AUTORIZACION);
  private readonly listarCasoDeUso = inject(LISTAR_AUTORIZACIONES_DEL_DIA);
  private readonly reloj = inject(RELOJ_GATEWAY);
  private readonly sesion = inject(SesionFacade);
  private readonly anunciador = inject(LiveAnnouncer);

  private consulta = 0;
  private totalReferencia: number | null = null;

  readonly enviando = signal(false);
  readonly resultado = signal<Autorizacion | null>(null);
  readonly carencia = signal<Carencia | null>(null);

  readonly fecha = signal(this.reloj.hoy());
  readonly pagina = signal(1);
  readonly items = signal<readonly Autorizacion[]>([]);
  readonly resumen = signal<ResumenDia | null>(null);
  readonly estado = signal<EstadoLista>('inactivo');
  readonly errorLista = signal<string | null>(null);
  readonly totalCambio = signal(false);

  readonly totalPaginas = computed(() => {
    const total = this.resumen()?.total ?? 0;
    return Math.max(1, Math.ceil(total / TAMANO_PAGINA));
  });

  constructor() {
    effect(() => {
      if (!this.sesion.activa()) this.reiniciar();
    });
  }

  cargarInicial(): Promise<void> {
    return this.cargar(1, false);
  }

  irAPagina(pagina: number): Promise<void> {
    if (pagina < 1 || pagina > this.totalPaginas()) return Promise.resolve();
    return this.cargar(pagina, true);
  }

  refrescar(): Promise<void> {
    this.totalReferencia = null;
    return this.cargar(this.pagina(), false);
  }

  cambiarFecha(fecha: string): Promise<void> {
    if (!fecha) return Promise.resolve();
    this.fecha.set(fecha);
    this.totalReferencia = null;
    return this.cargar(1, false);
  }

  async registrar(solicitud: SolicitudAutorizacion): Promise<ResultadoEnvio> {
    if (this.enviando()) return { tipo: 'ignorado' };
    this.enviando.set(true);
    this.resultado.set(null);
    this.carencia.set(null);
    try {
      const { autorizacion } = await this.registrarCasoDeUso.ejecutar(solicitud);
      this.resultado.set(autorizacion);
      void this.refrescar();
      return { tipo: 'ok' };
    } catch (error) {
      return this.traducir(error);
    } finally {
      this.enviando.set(false);
    }
  }

  private async cargar(pagina: number, cambioDePagina: boolean): Promise<void> {
    const consulta = ++this.consulta;
    this.estado.set('cargando');
    this.errorLista.set(null);
    try {
      const resultado = await this.listarCasoDeUso.ejecutar(this.fecha(), pagina);
      if (consulta !== this.consulta) return;
      const anterior = this.totalReferencia;
      this.totalCambio.set(cambioDePagina && anterior !== null && anterior !== resultado.resumen.total);
      this.totalReferencia = resultado.resumen.total;
      this.pagina.set(pagina);
      this.items.set(resultado.items);
      this.resumen.set(resultado.resumen);
      this.estado.set('listo');
      this.anunciador.announce(
        resultado.resumen.total === 0
          ? 'No hay autorizaciones para la fecha seleccionada.'
          : `Se cargó la página ${pagina} de autorizaciones.`,
        'polite',
      );
    } catch (error) {
      if (consulta !== this.consulta) return;
      this.estado.set('error');
      this.errorLista.set(this.mensajeDeLista(error));
    }
  }

  private mensajeDeLista(error: unknown): string {
    if (error instanceof ErrorDeRedError) return 'No hay conexión con el servidor. Intente de nuevo.';
    if (error instanceof SesionExpiradaError) return 'Su sesión no es válida.';
    if (error instanceof SolicitudInvalidaError) return error.errores.map((e) => e.mensaje).join(' ');
    return 'No se pudo cargar la lista de autorizaciones. Intente de nuevo.';
  }

  private traducir(error: unknown): ResultadoEnvio {
    if (error instanceof SolicitudInvalidaError) return { tipo: 'campos', errores: error.errores };
    if (error instanceof AseguradoNoEncontradoError) {
      return { tipo: 'campos', errores: [{ campo: CAMPO_DOCUMENTO, mensaje: error.message }] };
    }
    if (error instanceof EnCarenciaError) {
      this.carencia.set({ disponibleDesde: error.disponibleDesde, mensaje: error.message });
      return { tipo: 'carencia' };
    }
    if (error instanceof SesionExpiradaError) {
      return { tipo: 'general', mensaje: 'Su sesión venció. Inicie sesión de nuevo.' };
    }
    if (error instanceof SinPermisoError) {
      return { tipo: 'general', mensaje: 'Su rol no tiene permiso para registrar autorizaciones.' };
    }
    if (error instanceof ErrorDeRedError) {
      return {
        tipo: 'general',
        mensaje:
          'No hay conexión con el servidor. No se pudo confirmar si la autorización quedó registrada; revise la lista antes de volver a enviar.',
      };
    }
    return { tipo: 'general', mensaje: 'Ocurrió un error inesperado. Intente de nuevo más tarde.' };
  }

  private reiniciar(): void {
    this.consulta++;
    this.totalReferencia = null;
    this.enviando.set(false);
    this.resultado.set(null);
    this.carencia.set(null);
    this.fecha.set(this.reloj.hoy());
    this.pagina.set(1);
    this.items.set([]);
    this.resumen.set(null);
    this.estado.set('inactivo');
    this.errorLista.set(null);
    this.totalCambio.set(false);
  }
}