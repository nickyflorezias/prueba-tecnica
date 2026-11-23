package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto;

import java.util.List;

public record ErroresResponse(List<ErrorCampo> errores) {

    public record ErrorCampo(String campo, String mensaje) {
    }
}
