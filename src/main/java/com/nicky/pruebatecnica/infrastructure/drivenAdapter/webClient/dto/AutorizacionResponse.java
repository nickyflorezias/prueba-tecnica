package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record AutorizacionResponse(
        String id,
        @JsonProperty("asegurado_enmascarado") String aseguradoEnmascarado,
        ServicioResponse servicio,
        int cantidad,
        long valor,
        long deducible,
        long coaseguro,
        @JsonProperty("pago_asegurado") long pagoAsegurado,
        @JsonProperty("pago_aseguradora") long pagoAseguradora,
        String sede,
        @JsonProperty("fecha_hora") String fechaHora) {

    public record ServicioResponse(String codigo, String nombre, String complejidad) {
    }
}
