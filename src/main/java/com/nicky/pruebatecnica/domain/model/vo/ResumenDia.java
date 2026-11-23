package com.nicky.pruebatecnica.domain.model.vo;

public record ResumenDia(long total, long valorTotal, long recaudoEsperado) {
    public static final ResumenDia VACIO = new ResumenDia(0, 0, 0);
}