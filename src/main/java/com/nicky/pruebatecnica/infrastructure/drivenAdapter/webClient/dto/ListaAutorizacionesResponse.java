package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record ListaAutorizacionesResponse(
        List<AutorizacionResponse> items,
        int pagina,
        int tamano,
        long total,
        @JsonProperty("valor_total") long valorTotal,
        @JsonProperty("recaudo_esperado") long recaudoEsperado,
        @JsonProperty("calculado_en") String calculadoEn) {
}
