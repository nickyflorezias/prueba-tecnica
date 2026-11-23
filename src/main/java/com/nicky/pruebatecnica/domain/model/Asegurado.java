package com.nicky.pruebatecnica.domain.model;

import java.time.LocalDate;

public record Asegurado(
                Long id,
                String documento,
                LocalDate fechaIngreso,
                LocalDate anioPolizaInicio,
                Long pagosOtrosCanales) {

        public String documentoEnmascarado() {
                String ultimos = documento.substring(Math.max(0, documento.length() - 4));
                return "XXXX" + ultimos;
        }
}
