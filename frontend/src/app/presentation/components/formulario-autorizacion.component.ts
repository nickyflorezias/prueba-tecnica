import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TARIFARIO_SEDE_IPS_0412 } from '../../domain/rules/tarifario-sede-ips-0412';
import {
  CAMPO_CANTIDAD,
  CAMPO_DOCUMENTO,
  CAMPO_SERVICIO,
  validarCantidad,
  validarDocumento,
  validarServicio,
} from '../../domain/rules/validacion-solicitud';
import { formatearFecha, formatearPesos } from '../format/formatos';
import { mensajeDeError, validadorDeDominio } from '../forms/validador-dominio';
import { AutorizacionesFacade } from '../state/autorizaciones.facade';

type Campo = 'documento' | 'servicio' | 'cantidad';

const CAMPOS: readonly Campo[] = ['documento', 'servicio', 'cantidad'];
const ETIQUETAS: Record<Campo, string> = {
  documento: 'Documento del asegurado',
  servicio: 'Servicio',
  cantidad: 'Cantidad',
};
const CAMPO_DE_SERVIDOR: Record<string, Campo> = {
  [CAMPO_DOCUMENTO]: 'documento',
  [CAMPO_SERVICIO]: 'servicio',
  [CAMPO_CANTIDAD]: 'cantidad',
};

interface EntradaResumen {
  readonly campo: Campo | null;
  readonly mensaje: string;
}

@Component({
  selector: 'app-formulario-autorizacion',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-formulario" class="panel">
      <h2 id="titulo-formulario">Autorizar un servicio</h2>
      <form [formGroup]="formulario" (ngSubmit)="enviar()" (focusout)="sincronizar()" novalidate>
        <div class="resumen-errores" role="alert" tabindex="-1" id="resumen-errores">
          @if (resumen().length > 0) {
            <p><strong>Hay {{ resumen().length === 1 ? 'un error' : 'errores' }} en el formulario:</strong></p>
            <ul>
              @for (entrada of resumen(); track entrada.mensaje) {
                <li>
                  @if (entrada.campo; as campo) {
                    <a [href]="'#' + campo" (click)="enfocarCampo($event, campo)">{{ entrada.mensaje }}</a>
                  } @else {
                    {{ entrada.mensaje }}
                  }
                </li>
              }
            </ul>
          }
        </div>

        <div class="campos">
          <div class="campo">
            <label for="documento">Documento del asegurado</label>
            <div class="con-boton">
              <input
                id="documento"
                formControlName="documento"
                [type]="mostrarDocumento() ? 'text' : 'password'"
                autocomplete="off"
                inputmode="numeric"
                autocapitalize="off"
                spellcheck="false"
                [attr.aria-invalid]="errores().documento ? 'true' : null"
                [attr.aria-describedby]="descripcion('documento')"
              />
              <button
                type="button"
                class="secundario"
                [attr.aria-pressed]="mostrarDocumento()"
                (click)="mostrarDocumento.set(!mostrarDocumento())"
              >
                Mostrar documento
              </button>
            </div>
            <p id="documento-ayuda" class="ayuda">De 6 a 10 dígitos. Se oculta mientras lo digita.</p>
            @if (errores().documento; as mensaje) {
              <p id="documento-error" class="error"><span class="prefijo">Error:</span> {{ mensaje }}</p>
            }
          </div>

          <div class="campo">
            <label for="servicio">Servicio</label>
            <select
              id="servicio"
              formControlName="servicio"
              [attr.aria-invalid]="errores().servicio ? 'true' : null"
              [attr.aria-describedby]="descripcion('servicio')"
            >
              <option value="">Seleccione un servicio</option>
              @for (servicio of servicios; track servicio.codigo) {
                <option [value]="servicio.codigo">{{ servicio.codigo }} · {{ servicio.nombre }}</option>
              }
            </select>
            @if (errores().servicio; as mensaje) {
              <p id="servicio-error" class="error"><span class="prefijo">Error:</span> {{ mensaje }}</p>
            }
          </div>

          <div class="campo">
            <label for="cantidad">Cantidad</label>
            <input
              id="cantidad"
              formControlName="cantidad"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              [attr.aria-invalid]="errores().cantidad ? 'true' : null"
              [attr.aria-describedby]="descripcion('cantidad')"
            />
            <p id="cantidad-ayuda" class="ayuda">Entero entre 1 y 10.</p>
            @if (errores().cantidad; as mensaje) {
              <p id="cantidad-error" class="error"><span class="prefijo">Error:</span> {{ mensaje }}</p>
            }
          </div>
        </div>

        <button type="submit" class="primario" [disabled]="facade.enviando()">
          {{ facade.enviando() ? 'Enviando…' : 'Autorizar' }}
        </button>
      </form>

      <div id="resultado" class="resultado" role="status" aria-live="polite" tabindex="-1">
        @if (facade.resultado(); as autorizacion) {
          <h3>Autorización {{ autorizacion.id }} registrada</h3>
          <p>Documento: {{ autorizacion.aseguradoEnmascarado }} · {{ autorizacion.servicio.nombre }} × {{ autorizacion.cantidad }}</p>
          <dl class="liquidacion">
            <div><dt>Valor del servicio</dt><dd>{{ pesos(autorizacion.valor) }}</dd></div>
            <div><dt>Deducible</dt><dd>{{ pesos(autorizacion.deducible) }}</dd></div>
            <div><dt>Coaseguro</dt><dd>{{ pesos(autorizacion.coaseguro) }}</dd></div>
            <div class="destacado"><dt>Paga el asegurado</dt><dd>{{ pesos(autorizacion.pagoAsegurado) }}</dd></div>
            <div class="destacado"><dt>Paga la aseguradora</dt><dd>{{ pesos(autorizacion.pagoAseguradora) }}</dd></div>
          </dl>
        }
        @if (facade.carencia(); as carencia) {
          <h3>No se puede autorizar todavía</h3>
          <p>{{ carencia.mensaje }}. Se podrá autorizar desde el {{ fechaLarga(carencia.disponibleDesde) }}.</p>
        }
      </div>
    </section>
  `,
})
export class FormularioAutorizacionComponent {
  protected readonly facade = inject(AutorizacionesFacade);
  private readonly anfitrion = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly servicios = TARIFARIO_SEDE_IPS_0412;
  protected readonly mostrarDocumento = signal(false);
  private readonly intentado = signal(false);
  private readonly mensajeGeneral = signal<string | null>(null);

  protected readonly formulario = new FormGroup({
    documento: new FormControl('', { nonNullable: true, validators: [validadorDeDominio(validarDocumento)] }),
    servicio: new FormControl('', { nonNullable: true, validators: [validadorDeDominio(validarServicio)] }),
    cantidad: new FormControl('', { nonNullable: true, validators: [validadorDeDominio(validarCantidad)] }),
  });

  protected readonly errores = signal<Partial<Record<Campo, string>>>({});

  protected readonly resumen = computed<readonly EntradaResumen[]>(() => {
    const porCampo = CAMPOS.flatMap((campo) => {
      const mensaje = this.errores()[campo];
      return mensaje ? [{ campo, mensaje: `${ETIQUETAS[campo]}: ${mensaje}` }] : [];
    });
    const general = this.mensajeGeneral();
    return general ? [...porCampo, { campo: null, mensaje: general }] : porCampo;
  });

  constructor() {
    this.formulario.valueChanges.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => this.sincronizar());
  }

  protected pesos = formatearPesos;
  protected fechaLarga = formatearFecha;

  protected descripcion(campo: Campo): string | null {
    const ids = [];
    if (campo !== 'servicio') ids.push(`${campo}-ayuda`);
    if (this.errores()[campo]) ids.push(`${campo}-error`);
    return ids.length > 0 ? ids.join(' ') : null;
  }

  protected sincronizar(): void {
    const siguiente: Partial<Record<Campo, string>> = {};
    for (const campo of CAMPOS) {
      const control = this.formulario.controls[campo];
      if (!control.touched && !this.intentado()) continue;
      const mensaje = mensajeDeError(control);
      if (mensaje) siguiente[campo] = mensaje;
    }
    this.errores.set(siguiente);
  }

  protected enfocarCampo(evento: Event, campo: Campo): void {
    evento.preventDefault();
    this.anfitrion.nativeElement.querySelector<HTMLElement>(`#${campo}`)?.focus();
  }

  protected async enviar(): Promise<void> {
    if (this.facade.enviando()) return;
    this.intentado.set(true);
    this.mensajeGeneral.set(null);
    this.formulario.markAllAsTouched();
    this.sincronizar();
    if (this.formulario.invalid) {
      this.enfocarPrimerError();
      return;
    }
    const { documento, servicio, cantidad } = this.formulario.getRawValue();
    const respuesta = await this.facade.registrar({ documento, codigoServicio: servicio, cantidad });
    switch (respuesta.tipo) {
      case 'ok':
        this.limpiar();
        this.enfocarDespuesDePintar('#resultado');
        break;
      case 'campos':
        for (const error of respuesta.errores) {
          const campo = CAMPO_DE_SERVIDOR[error.campo];
          if (campo) {
            const control = this.formulario.controls[campo];
            control.setErrors({ servidor: error.mensaje });
            control.markAsTouched();
          } else {
            this.mensajeGeneral.set(error.mensaje);
          }
        }
        this.sincronizar();
        this.enfocarPrimerError();
        break;
      case 'carencia':
        this.enfocarDespuesDePintar('#resultado');
        break;
      case 'general':
        this.mensajeGeneral.set(respuesta.mensaje);
        this.enfocarDespuesDePintar('#resumen-errores');
        break;
      case 'ignorado':
        break;
    }
  }

  private limpiar(): void {
    this.intentado.set(false);
    this.mostrarDocumento.set(false);
    this.formulario.reset({ documento: '', servicio: '', cantidad: '' });
    this.errores.set({});
  }

  private enfocarPrimerError(): void {
    const campo = CAMPOS.find((c) => this.errores()[c]);
    this.enfocarDespuesDePintar(campo ? `#${campo}` : '#resumen-errores');
  }

  private enfocarDespuesDePintar(selector: string): void {
    afterNextRender(
      () => this.anfitrion.nativeElement.querySelector<HTMLElement>(selector)?.focus(),
      { injector: this.injector },
    );
  }
}