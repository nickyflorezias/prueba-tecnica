import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { DialogoInactividadComponent } from '../components/dialogo-inactividad.component';
import { FormularioAutorizacionComponent } from '../components/formulario-autorizacion.component';
import { ListaAutorizacionesComponent } from '../components/lista-autorizaciones.component';
import { AutorizacionesFacade } from '../state/autorizaciones.facade';
import { SesionFacade } from '../state/sesion.facade';

@Component({
  selector: 'app-pantalla-autorizaciones',
  imports: [FormularioAutorizacionComponent, ListaAutorizacionesComponent, DialogoInactividadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="saltar" href="#contenido" (click)="saltar($event)">Saltar al contenido</a>
    <div [attr.inert]="sesion.avisoInactividad() ? '' : null">
      <header class="cabecera">
        <div>
          <h1 tabindex="-1">Autorizaciones de servicios</h1>
          @if (sesion.sesion(); as s) {
            <p class="contexto">
              Sede <strong>{{ s.sede }}</strong> · Rol <strong>{{ nombreRol(s.rol) }}</strong>
            </p>
          }
        </div>
        <button type="button" class="secundario" (click)="sesion.cerrar()">Cerrar sesión</button>
      </header>
      <main id="contenido" tabindex="-1">
        @if (sesion.puedeRegistrar()) {
          <app-formulario-autorizacion />
        } @else {
          <p class="nota">Su rol solo permite consultar las autorizaciones de la sede.</p>
        }
        <app-lista-autorizaciones />
      </main>
    </div>
    @if (sesion.avisoInactividad()) {
      <app-dialogo-inactividad />
    }
  `,
})
export class PantallaAutorizacionesPage implements OnInit {
  protected readonly sesion = inject(SesionFacade);
  private readonly autorizaciones = inject(AutorizacionesFacade);

  ngOnInit(): void {
    void this.autorizaciones.cargarInicial();
  }

  protected nombreRol(rol: string): string {
    return rol === 'AUXILIAR_ADMISION' ? 'Auxiliar de admisión' : 'Auxiliar de caja';
  }

  protected saltar(evento: Event): void {
    evento.preventDefault();
    document.getElementById('contenido')?.focus();
  }
}