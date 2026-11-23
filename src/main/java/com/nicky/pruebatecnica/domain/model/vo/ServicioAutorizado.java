package com.nicky.pruebatecnica.domain.model.vo;

import com.nicky.pruebatecnica.domain.model.Complejidad;

public record ServicioAutorizado(String codigo, String nombre,
                                 Complejidad complejidad, long valorUnitario) {
}