package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient;

import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ErroresResponse.ErrorCampo;

import java.util.List;

public class SolicitudInvalidaException extends RuntimeException {

    private final transient List<ErrorCampo> errores;

    public SolicitudInvalidaException(List<ErrorCampo> errores) {
        super("Solicitud inválida");
        this.errores = errores;
    }

    public List<ErrorCampo> getErrores() {
        return errores;
    }
}
