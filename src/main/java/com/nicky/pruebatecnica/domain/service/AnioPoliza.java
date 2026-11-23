package com.nicky.pruebatecnica.domain.service;

import java.time.LocalDate;

/** Año de póliza: periodo de 12 meses que empieza en cada aniversario del ingreso, en hora de Colombia. */
public final class AnioPoliza {

    private AnioPoliza() {
    }

    /** Inicio del año de póliza vigente en {@code hoy}. Un ingreso el 29-feb renueva el 28-feb en años no bisiestos. */
    public static LocalDate inicioVigente(LocalDate fechaIngreso, LocalDate hoy) {
        LocalDate aniversarioEsteAnio = fechaIngreso.withYear(hoy.getYear());
        return aniversarioEsteAnio.isAfter(hoy) ? fechaIngreso.withYear(hoy.getYear() - 1) : aniversarioEsteAnio;
    }
}
