package com.nicky.pruebatecnica.domain.usecase.autorizacion;

public record RegistrarAutorizacionComando(String documentoAsegurado, String codigoServicio,
                                           int cantidad, String sede) {
}
