import { Autorizacion } from './autorizacion';

export interface ResumenDia {
  readonly total: number;
  readonly valorTotal: number;
  readonly recaudoEsperado: number;
  readonly calculadoEn: string;
}

export interface PaginaAutorizaciones {
  readonly items: readonly Autorizacion[];
  readonly pagina: number;
  readonly tamano: number;
  readonly resumen: ResumenDia;
}