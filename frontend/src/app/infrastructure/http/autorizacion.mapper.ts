import { Autorizacion } from '../../domain/model/autorizacion';
import { PaginaAutorizaciones } from '../../domain/model/pagina-autorizaciones';
import { SolicitudAutorizacion } from '../../domain/model/solicitud-autorizacion';
import { AutorizacionDto, ListaAutorizacionesDto, RegistroRequestDto } from './autorizacion.dto';

export function aRequestDto(solicitud: SolicitudAutorizacion): RegistroRequestDto {
  return {
    documento_asegurado: solicitud.documento,
    codigo_servicio: solicitud.codigoServicio,
    cantidad: Number(solicitud.cantidad),
  };
}

export function aAutorizacion(dto: AutorizacionDto): Autorizacion {
  return {
    id: dto.id,
    aseguradoEnmascarado: dto.asegurado_enmascarado,
    servicio: {
      codigo: dto.servicio.codigo,
      nombre: dto.servicio.nombre,
      complejidad: dto.servicio.complejidad,
    },
    cantidad: dto.cantidad,
    valor: dto.valor,
    deducible: dto.deducible,
    coaseguro: dto.coaseguro,
    pagoAsegurado: dto.pago_asegurado,
    pagoAseguradora: dto.pago_aseguradora,
    sede: dto.sede,
    fechaHora: dto.fecha_hora,
  };
}

export function aPagina(dto: ListaAutorizacionesDto): PaginaAutorizaciones {
  return {
    items: dto.items.map(aAutorizacion),
    pagina: dto.pagina,
    tamano: dto.tamano,
    resumen: {
      total: dto.total,
      valorTotal: dto.valor_total,
      recaudoEsperado: dto.recaudo_esperado,
      calculadoEn: dto.calculado_en,
    },
  };
}