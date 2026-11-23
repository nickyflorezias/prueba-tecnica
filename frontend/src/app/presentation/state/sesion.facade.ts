import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  CERRAR_SESION,
  GESTIONAR_INACTIVIDAD,
  INICIAR_SESION_SIMULADA,
  RENOVAR_SESION,
  SESION_GATEWAY,
} from '../../di/tokens';
import { ErrorDeRedError } from '../../domain/error/errores-dominio';
import { ROL_ADMISION } from '../../domain/model/rol';
import { MotivoCierre, PerfilSesion, Sesion } from '../../domain/model/sesion';

const MENSAJES_CIERRE: Record<MotivoCierre, string> = {
  manual: 'Cerró la sesión. Los datos de la pantalla se borraron.',
  inactividad: 'La sesión se cerró por 3 minutos de inactividad. Los datos de la pantalla se borraron.',
  'no-autorizada': 'Su sesión venció o no es válida. Inicie sesión de nuevo. Los datos de la pantalla se borraron.',
};

@Injectable({ providedIn: 'root' })
export class SesionFacade {
  private readonly sesiones = inject(SESION_GATEWAY);
  private readonly iniciarCasoDeUso = inject(INICIAR_SESION_SIMULADA);
  private readonly cerrarCasoDeUso = inject(CERRAR_SESION);
  private readonly inactividad = inject(GESTIONAR_INACTIVIDAD);
  private readonly renovarCasoDeUso = inject(RENOVAR_SESION);
  private readonly router = inject(Router);

  private readonly _sesion = signal<Sesion | null>(null);
  readonly sesion = this._sesion.asReadonly();
  readonly activa = computed(() => this._sesion() !== null);
  readonly puedeRegistrar = computed(() => this._sesion()?.rol === ROL_ADMISION);
  readonly mensajeCierre = signal<string | null>(null);
  readonly errorDeIngreso = signal<string | null>(null);
  readonly ingresando = signal(false);
  readonly avisoInactividad = signal(false);

  constructor() {
    this.sesiones.suscribir((sesion, motivo) => {
      this._sesion.set(sesion);
      if (sesion === null) this.alCerrarse(motivo ?? 'manual');
    });
  }

  async iniciar(perfil: PerfilSesion): Promise<void> {
    if (this.ingresando()) return;
    this.ingresando.set(true);
    this.errorDeIngreso.set(null);
    try {
      await this.iniciarCasoDeUso.ejecutar(perfil);
      this.mensajeCierre.set(null);
      this.inactividad.iniciar({
        alAvisar: () => this.avisoInactividad.set(true),
        alExpirar: () => this.cerrarCasoDeUso.ejecutar('inactividad'),
        alActividad: () => {
          this.renovarCasoDeUso.ejecutar().catch(() => undefined);
        },
      });
      await this.router.navigateByUrl('/');
    } catch (error) {
      this.errorDeIngreso.set(
        error instanceof ErrorDeRedError
          ? 'No se pudo contactar el servidor de tokens de desarrollo. Verifique que npm start esté en ejecución.'
          : 'No se pudo iniciar la sesión simulada.',
      );
    } finally {
      this.ingresando.set(false);
    }
  }

  cerrar(): void {
    this.cerrarCasoDeUso.ejecutar('manual');
  }

  continuar(): void {
    this.avisoInactividad.set(false);
    this.inactividad.continuar();
    this.renovarCasoDeUso.ejecutar().catch(() => undefined);
  }

  private alCerrarse(motivo: MotivoCierre): void {
    this.inactividad.detener();
    this.avisoInactividad.set(false);
    this.mensajeCierre.set(MENSAJES_CIERRE[motivo]);
    void this.router.navigateByUrl('/entrada');
  }
}