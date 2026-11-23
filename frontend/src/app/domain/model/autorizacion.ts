import { Servicio } from './servicio';

export interface Autorizacion {
  readonly id: string;
  readonly aseguradoEnmascarado: string;
  readonly servicio: Servicio;
  readonly cantidad: number;
  readonly valor: number;
  readonly deducible: number;
  readonly coaseguro: number;
  readonly pagoAsegurado: number;
  readonly pagoAseguradora: number;
  readonly sede: string;
  readonly fechaHora: string;
}