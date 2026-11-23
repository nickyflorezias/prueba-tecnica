import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';
import { AVISO_ANTES_DE_CERRAR_MS } from '../../domain/rules/reglas-sesion';
import { SesionFacade } from '../state/sesion.facade';

@Component({
  selector: 'app-dialogo-inactividad',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="velo">
      <div
        #dialogo
        class="dialogo"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dialogo-titulo"
        aria-describedby="dialogo-descripcion"
        (keydown.escape)="sesion.continuar()"
      >
        <h2 id="dialogo-titulo">Su sesión está por cerrarse</h2>
        <p id="dialogo-descripcion">
          Por inactividad, la sesión se cerrará en menos de {{ segundos }} segundos y se borrarán los datos de la
          pantalla.
        </p>
        <div class="acciones">
          <button type="button" class="primario" cdkFocusInitial (click)="sesion.continuar()">Seguir trabajando</button>
          <button type="button" class="secundario" (click)="sesion.cerrar()">Cerrar sesión</button>
        </div>
      </div>
    </div>
  `,
})
export class DialogoInactividadComponent implements OnDestroy {
  protected readonly sesion = inject(SesionFacade);
  protected readonly segundos = AVISO_ANTES_DE_CERRAR_MS / 1000;
  private readonly dialogo = viewChild.required<ElementRef<HTMLElement>>('dialogo');
  private readonly fabrica = inject(FocusTrapFactory);
  private readonly previo = document.activeElement as HTMLElement | null;
  private trampa: FocusTrap | null = null;

  constructor() {
    afterNextRender(() => {
      this.trampa = this.fabrica.create(this.dialogo().nativeElement);
      void this.trampa.focusInitialElementWhenReady();
    });
  }

  ngOnDestroy(): void {
    this.trampa?.destroy();
    if (this.previo?.isConnected) this.previo.focus();
  }
}