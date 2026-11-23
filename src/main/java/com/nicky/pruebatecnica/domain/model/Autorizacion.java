package com.nicky.pruebatecnica.domain.model;

import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;

import java.time.Instant;

public record Autorizacion(
        Long id,
        Long aseguradoId,
        String aseguradoEnmascarado,
        String sede,
        ServicioAutorizado servicio,
        int cantidad,
        Liquidacion liquidacion,
        Instant fechaHora) {

    public Autorizacion {
        if (cantidad < 1 || cantidad > 10) {
            throw new IllegalArgumentException("cantidad fuera de rango");
        }
    }

    public static Autorizacion nueva(Long aseguradoId, String aseguradoEnmascarado, String sede,
            ServicioAutorizado servicio, int cantidad, Liquidacion liquidacion, Instant fechaHora) {
        return new Autorizacion(null, aseguradoId, aseguradoEnmascarado, sede, servicio, cantidad,
                liquidacion, fechaHora);
    }

    public String idPublico() {
        return String.format("AU-%06d", id);
    }
}
