package com.nicky.pruebatecnica.domain.model.exception;

import java.time.LocalDate;

/** El asegurado aún está en periodo de carencia para un servicio de complejidad alta. */
public class EnCarenciaException extends RuntimeException {

    private final LocalDate disponibleDesde;

    public EnCarenciaException(LocalDate disponibleDesde) {
        super("El asegurado está en periodo de carencia para servicios de complejidad alta");
        this.disponibleDesde = disponibleDesde;
    }

    public LocalDate getDisponibleDesde() {
        return disponibleDesde;
    }
}
