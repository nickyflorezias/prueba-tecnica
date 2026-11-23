export interface ServicioDto {
  codigo: string;
  nombre: string;
  complejidad: 'baja' | 'alta';
}

export interface AutorizacionDto {
  id: string;
  asegurado_enmascarado: string;
  servicio: ServicioDto;
  cantidad: number;
  valor: number;
  deducible: number;
  coaseguro: number;
  pago_asegurado: number;
  pago_aseguradora: number;
  sede: string;
  fecha_hora: string;
}

export interface RegistroRequestDto {
  documento_asegurado: string;
  codigo_servicio: string;
  cantidad: number;
}

export interface ListaAutorizacionesDto {
  items: AutorizacionDto[];
  pagina: number;
  tamano: number;
  total: number;
  valor_total: number;
  recaudo_esperado: number;
  calculado_en: string;
}

export interface ErroresDto {
  errores?: { campo: string; mensaje: string }[];
}

export interface ErrorNegocioDto {
  codigo?: string;
  mensaje?: string;
  disponible_desde?: string;
}