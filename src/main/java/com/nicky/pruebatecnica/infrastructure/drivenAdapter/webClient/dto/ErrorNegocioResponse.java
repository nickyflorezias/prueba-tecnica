package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

public record ErrorNegocioResponse(
        String codigo,
        String mensaje,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        @JsonProperty("disponible_desde") String disponibleDesde) {
}
