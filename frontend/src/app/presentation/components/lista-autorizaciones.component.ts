import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { formatearFechaHora, formatearHora, formatearPesos } from '../format/formatos';
import { AutorizacionesFacade } from '../state/autorizaciones.facade';
import { SesionFacade } from '../state/sesion.facade';

@Component({
  selector: 'app-lista-autorizaciones',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section aria-labelledby="titulo-lista" class="panel">
      <h2 id="titulo-lista">Autorizaciones del día</h2>

      <div class="filtro">
        <label for="fecha">Fecha</label>
        <input
          id="fecha"
          type="date"
          [value]="facade.fecha()"
          (change)="cambiarFecha($event)"
        />
        <button type="button" class="secundario" (click)="facade.refrescar()">Refrescar</button>
      </div>

      <p class="aviso" role="status" aria-live="polite">
        @if (facade.totalCambio()) {
          El total de autorizaciones cambió mientras navegaba. Pulse Refrescar para ver datos actualizados.
        }
      </p>

      <div role="status" aria-live="polite" class="estado">
        @switch (facade.estado()) {
          @case ('cargando') {
            <p>Cargando autorizaciones…</p>
          }
          @case ('listo') {
            @if (facade.items().length === 0) {
              <p>No hay autorizaciones para esta fecha.</p>
            }
          }
        }
      </div>

      @if (facade.estado() === 'error') {
        <div class="error-lista" role="alert">
          <p><span class="prefijo">Error:</span> {{ facade.errorLista() }}</p>
          <button type="button" class="secundario" (click)="facade.refrescar()">Reintentar</button>
        </div>
      }

      @if (facade.resumen(); as resumen) {
        <dl class="totales" aria-label="Totales del día según el servidor">
          <div><dt>Total de autorizaciones</dt><dd>{{ resumen.total }}</dd></div>
          <div><dt>Valor total</dt><dd>{{ pesos(resumen.valorTotal) }}</dd></div>
          <div><dt>Recaudo esperado</dt><dd>{{ pesos(resumen.recaudoEsperado) }}</dd></div>
          <div><dt>Calculado en</dt><dd>{{ fechaHora(resumen.calculadoEn) }}</dd></div>
        </dl>
      }

      @if (facade.items().length > 0) {
        <div
          class="tabla-scroll"
          role="region"
          aria-labelledby="titulo-lista"
          tabindex="0"
          [attr.aria-busy]="facade.estado() === 'cargando'"
        >
          <table>
            <caption>
              Autorizaciones del {{ facade.fecha() }} en la sede {{ sede() }}
            </caption>
            <thead>
              <tr>
                <th scope="col">Id</th>
                <th scope="col">Hora</th>
                <th scope="col">Documento</th>
                <th scope="col">Servicio</th>
                <th scope="col" class="num">Cantidad</th>
                <th scope="col" class="num">Valor</th>
                <th scope="col" class="num">Paga el asegurado</th>
                <th scope="col" class="num">Paga la aseguradora</th>
              </tr>
            </thead>
            <tbody>
              @for (a of facade.items(); track a.id) {
                <tr>
                  <th scope="row">{{ a.id }}</th>
                  <td>{{ hora(a.fechaHora) }}</td>
                  <td>{{ a.aseguradoEnmascarado }}</td>
                  <td>{{ a.servicio.nombre }}</td>
                  <td class="num">{{ a.cantidad }}</td>
                  <td class="num">{{ pesos(a.valor) }}</td>
                  <td class="num">{{ pesos(a.pagoAsegurado) }}</td>
                  <td class="num">{{ pesos(a.pagoAseguradora) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      @if (facade.resumen() && facade.totalPaginas() > 0) {
        <nav aria-label="Paginación de autorizaciones" class="paginacion">
          <button
            type="button"
            class="secundario"
            [disabled]="facade.pagina() <= 1 || facade.estado() === 'cargando'"
            (click)="facade.irAPagina(facade.pagina() - 1)"
          >
            Anterior
          </button>
          @for (numero of numeros(); track numero) {
            <button
              type="button"
              class="numero"
              [attr.aria-current]="numero === facade.pagina() ? 'page' : null"
              [attr.aria-label]="'Página ' + numero"
              [disabled]="facade.estado() === 'cargando'"
              (click)="facade.irAPagina(numero)"
            >
              {{ numero }}
            </button>
          }
          <button
            type="button"
            class="secundario"
            [disabled]="facade.pagina() >= facade.totalPaginas() || facade.estado() === 'cargando'"
            (click)="facade.irAPagina(facade.pagina() + 1)"
          >
            Siguiente
          </button>
          <span class="posicion">Página {{ facade.pagina() }} de {{ facade.totalPaginas() }}</span>
        </nav>
      }
    </section>
  `,
})
export class ListaAutorizacionesComponent {
  protected readonly facade = inject(AutorizacionesFacade);
  private readonly sesion = inject(SesionFacade);

  protected readonly sede = computed(() => this.sesion.sesion()?.sede ?? '');
  protected readonly numeros = computed(() => {
    const total = this.facade.totalPaginas();
    const inicio = Math.max(1, Math.min(this.facade.pagina() - 2, total - 4));
    const fin = Math.min(total, inicio + 4);
    return Array.from({ length: fin - inicio + 1 }, (_, i) => inicio + i);
  });

  protected pesos = formatearPesos;
  protected hora = formatearHora;
  protected fechaHora = formatearFechaHora;

  protected cambiarFecha(evento: Event): void {
    void this.facade.cambiarFecha((evento.target as HTMLInputElement).value);
  }
}