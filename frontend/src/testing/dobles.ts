import { Autorizacion } from '../app/domain/model/autorizacion';
import { PaginaAutorizaciones } from '../app/domain/model/pagina-autorizaciones';
import { ResultadoRegistro } from '../app/domain/model/resultado-registro';
import { Sesion } from '../app/domain/model/sesion';
import { SolicitudAutorizacion } from '../app/domain/model/solicitud-autorizacion';
import { ActividadUsuarioGateway } from '../app/domain/port/actividad-usuario-gateway';
import { AutorizacionRepository } from '../app/domain/port/autorizacion-repository';
import { EmisorTokenGateway } from '../app/domain/port/emisor-token-gateway';
import { RelojGateway } from '../app/domain/port/reloj-gateway';
import { EscuchaSesion, SesionGateway } from '../app/domain/port/sesion-gateway';
import { MotivoCierre, PerfilSesion } from '../app/domain/model/sesion';

export function autorizacionDePrueba(id: string, valor = 100_000): Autorizacion {
  return {
    id,
    aseguradoEnmascarado: 'XXXX6521',
    servicio: { codigo: '883101', nombre: 'Resonancia magnética de columna', complejidad: 'alta' },
    cantidad: 1,
    valor,
    deducible: 20_000,
    coaseguro: 8_000,
    pagoAsegurado: 28_000,
    pagoAseguradora: valor - 28_000,
    sede: 'IPS-0412',
    fechaHora: '2026-11-19T08:05:00-05:00',
  };
}

export function paginaDePrueba(items: Autorizacion[], total = items.length, pagina = 1): PaginaAutorizaciones {
  return {
    items,
    pagina,
    tamano: 50,
    resumen: {
      total,
      valorTotal: 999_999,
      recaudoEsperado: 123_456,
      calculadoEn: '2026-11-19T18:40:00-05:00',
    },
  };
}

export class RepositorioFalso implements AutorizacionRepository {
  registros: SolicitudAutorizacion[] = [];
  consultas: Array<{ fecha: string; pagina: number; tamano: number }> = [];
  alRegistrar: (s: SolicitudAutorizacion) => Promise<ResultadoRegistro> = async () => ({
    autorizacion: autorizacionDePrueba('AU-000108'),
  });
  alListar: (fecha: string, pagina: number) => Promise<PaginaAutorizaciones> = async () => paginaDePrueba([]);

  registrar(solicitud: SolicitudAutorizacion): Promise<ResultadoRegistro> {
    this.registros.push(solicitud);
    return this.alRegistrar(solicitud);
  }

  listarDelDia(fecha: string, pagina: number, tamano: number): Promise<PaginaAutorizaciones> {
    this.consultas.push({ fecha, pagina, tamano });
    return this.alListar(fecha, pagina);
  }
}

export class SesionGatewayFalso implements SesionGateway {
  sesion: Sesion | null = null;
  private readonly escuchas = new Set<EscuchaSesion>();

  obtener(): Sesion | null {
    return this.sesion;
  }
  establecer(sesion: Sesion): void {
    this.sesion = sesion;
    this.escuchas.forEach((e) => e(sesion));
  }
  limpiar(motivo: MotivoCierre): void {
    this.sesion = null;
    this.escuchas.forEach((e) => e(null, motivo));
  }
  suscribir(escucha: EscuchaSesion): () => void {
    this.escuchas.add(escucha);
    return () => this.escuchas.delete(escucha);
  }
}

export function sesionDePrueba(sobre: Partial<Sesion> = {}): Sesion {
  return {
    perfil: 'admision-0412',
    usuario: 'aux.admision.0412',
    rol: 'AUXILIAR_ADMISION',
    sede: 'IPS-0412',
    expiraEn: 1_000_000 + 180_000,
    token: 'token-de-prueba',
    ...sobre,
  };
}

export class EmisorFalso implements EmisorTokenGateway {
  emisiones: PerfilSesion[] = [];
  siguiente: Sesion = sesionDePrueba();

  async emitir(perfil: PerfilSesion): Promise<Sesion> {
    this.emisiones.push(perfil);
    return this.siguiente;
  }
}

export class RelojFalso implements RelojGateway {
  constructor(public tiempo = 1_000_000) {}
  ahora(): number {
    return this.tiempo;
  }
  hoy(): string {
    return '2026-11-19';
  }
  programar(retardoMs: number, accion: () => void): () => void {
    const id = setTimeout(accion, retardoMs);
    return () => clearTimeout(id);
  }
}

export class ActividadFalsa implements ActividadUsuarioGateway {
  private manejador: (() => void) | null = null;
  escuchando = false;

  escuchar(alActividad: () => void): () => void {
    this.manejador = alActividad;
    this.escuchando = true;
    return () => {
      this.manejador = null;
      this.escuchando = false;
    };
  }
  simular(): void {
    this.manejador?.();
  }
}