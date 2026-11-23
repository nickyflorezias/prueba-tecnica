import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PerfilSesion } from '../../domain/model/sesion';
import { SesionFacade } from '../state/sesion.facade';

interface OpcionPerfil {
  readonly valor: PerfilSesion;
  readonly etiqueta: string;
}

@Component({
  selector: 'app-entrada',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main id="contenido" class="entrada">
      <h1 tabindex="-1">Ingreso al puesto de admisión</h1>
      <p class="simulacion"><strong>Simulación del proveedor de identidad, solo desarrollo</strong></p>

      @if (sesion.mensajeCierre(); as mensaje) {
        <p class="aviso" role="alert">{{ mensaje }}</p>
      }
      @if (sesion.errorDeIngreso(); as mensaje) {
        <p class="error" role="alert"><span class="prefijo">Error:</span> {{ mensaje }}</p>
      }

      <form (ngSubmit)="ingresar()">
        <fieldset>
          <legend>Perfil de la sesión simulada</legend>
          @for (opcion of opciones; track opcion.valor) {
            <div class="opcion">
              <input
                type="radio"
                name="perfil"
                [id]="'perfil-' + opcion.valor"
                [value]="opcion.valor"
                [checked]="perfil() === opcion.valor"
                (change)="perfil.set(opcion.valor)"
              />
              <label [for]="'perfil-' + opcion.valor">{{ opcion.etiqueta }}</label>
            </div>
          }
        </fieldset>
        <button type="submit" class="primario" [disabled]="sesion.ingresando()">Ingresar</button>
      </form>
    </main>
  `,
})
export class EntradaPage {
  protected readonly sesion = inject(SesionFacade);
  protected readonly perfil = signal<PerfilSesion>('admision-0412');
  protected readonly opciones: readonly OpcionPerfil[] = [
    { valor: 'admision-0412', etiqueta: 'Auxiliar de admisión · sede IPS-0412' },
    { valor: 'caja-0412', etiqueta: 'Auxiliar de caja · sede IPS-0412' },
    { valor: 'admision-0188', etiqueta: 'Auxiliar de admisión · sede IPS-0188' },
  ];

  protected ingresar(): void {
    void this.sesion.iniciar(this.perfil());
  }
}