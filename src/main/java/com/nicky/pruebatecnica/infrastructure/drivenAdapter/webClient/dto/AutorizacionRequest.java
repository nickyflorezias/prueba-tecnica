package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record AutorizacionRequest(

        @JsonProperty("documento_asegurado")
        @NotBlank(message = "El documento es obligatorio")
        @Pattern(regexp = "^\\d{6,10}$", message = "El documento debe tener entre 6 y 10 dígitos")
        String documentoAsegurado,

        @JsonProperty("codigo_servicio")
        @NotBlank(message = "El código de servicio es obligatorio")
        @Pattern(regexp = "^\\d{1,10}$", message = "El código de servicio solo admite dígitos")
        String codigoServicio,

        @JsonProperty("cantidad")
        @NotBlank(message = "La cantidad es obligatoria")
        @Pattern(regexp = "^([1-9]|10)$", message = "La cantidad debe ser un entero entre 1 y 10")
        String cantidad) {
}
