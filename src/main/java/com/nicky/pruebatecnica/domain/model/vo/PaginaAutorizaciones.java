package com.nicky.pruebatecnica.domain.model.vo;

import com.nicky.pruebatecnica.domain.model.Autorizacion;

import java.time.Instant;
import java.util.List;

public record PaginaAutorizaciones(List<Autorizacion> items, ResumenDia resumen, Instant calculadoEn) {
}
