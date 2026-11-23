package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import java.time.Instant;

import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;

public class SumarPagosAseguradoUseCase {

    private final AutorizacionRepository autorizacionRepository;

    public SumarPagosAseguradoUseCase(AutorizacionRepository autorizacionRepository) {
        this.autorizacionRepository = autorizacionRepository;
    }

    public long execute(Long aseguradoId, Instant desde, Instant hasta) {
        if (aseguradoId == null || desde == null || hasta == null) {
            throw new IllegalArgumentException("asegurado, desde y hasta son obligatorios");
        }
        if (!desde.isBefore(hasta)) {
            throw new IllegalArgumentException("desde debe ser anterior a hasta");
        }
        return this.autorizacionRepository.sumarPagosAsegurado(aseguradoId, desde, hasta);
    }
}
