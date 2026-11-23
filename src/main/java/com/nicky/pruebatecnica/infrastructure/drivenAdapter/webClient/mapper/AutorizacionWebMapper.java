package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.mapper;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.PaginaAutorizaciones;
import com.nicky.pruebatecnica.domain.model.vo.RangoDia;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.AutorizacionResponse;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ListaAutorizacionesResponse;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class AutorizacionWebMapper {

    public AutorizacionResponse toResponse(Autorizacion a) {
        var s = a.servicio();
        var l = a.liquidacion();
        return new AutorizacionResponse(
                a.idPublico(),
                a.aseguradoEnmascarado(),
                new AutorizacionResponse.ServicioResponse(
                        s.codigo(), s.nombre(), s.complejidad().name().toLowerCase(Locale.ROOT)),
                a.cantidad(),
                l.valor(), l.deducible(), l.coaseguro(), l.pagoAsegurado(), l.pagoAseguradora(),
                a.sede(),
                aHoraColombia(a.fechaHora()));
    }

    public ListaAutorizacionesResponse toResponse(PaginaAutorizaciones pagina, int numeroPagina, int tamano) {
        return new ListaAutorizacionesResponse(
                pagina.items().stream().map(this::toResponse).toList(),
                numeroPagina,
                tamano,
                pagina.resumen().total(),
                pagina.resumen().valorTotal(),
                pagina.resumen().recaudoEsperado(),
                aHoraColombia(pagina.calculadoEn()));
    }

    private static String aHoraColombia(Instant instante) {
        return DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(instante.atZone(RangoDia.ZONA_COLOMBIA));
    }
}
