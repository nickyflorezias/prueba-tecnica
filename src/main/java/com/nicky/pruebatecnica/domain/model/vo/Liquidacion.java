package com.nicky.pruebatecnica.domain.model.vo;

public record Liquidacion(long valor, long deducible, long coaseguro,
        long pagoAsegurado, long pagoAseguradora) {
    public Liquidacion {
        if (pagoAsegurado != deducible + coaseguro)
            throw new IllegalArgumentException("pagoAsegurado debe ser deducible + coaseguro");
        if (valor != pagoAsegurado + pagoAseguradora)
            throw new IllegalArgumentException("valor debe ser pagoAsegurado + pagoAseguradora");
    }
}