package com.nicky.pruebatecnica.domain.model.vo;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

public record RangoDia(Instant desde, Instant hasta) {

    public static final ZoneId ZONA_COLOMBIA = ZoneId.of("America/Bogota");

    public static RangoDia de(LocalDate fecha) {
        if (fecha == null) {
            throw new IllegalArgumentException("La fecha es obligatoria");
        }
        return new RangoDia(
                fecha.atStartOfDay(ZONA_COLOMBIA).toInstant(),
                fecha.plusDays(1).atStartOfDay(ZONA_COLOMBIA).toInstant());
    }
}
