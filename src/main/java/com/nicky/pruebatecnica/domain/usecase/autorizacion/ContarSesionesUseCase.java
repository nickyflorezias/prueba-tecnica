package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import java.time.Instant;

import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;

public class ContarSesionesUseCase {

    private final AutorizacionRepository autorizacionRepository;

    public ContarSesionesUseCase(AutorizacionRepository autorizacionRepository) {
        this.autorizacionRepository = autorizacionRepository;
    }

    public long execute(Long aseguradoId, String codigoServicio, Instant desde, Instant hasta) {
        if (aseguradoId == null || codigoServicio == null || codigoServicio.isBlank()
                || desde == null || hasta == null) {
            throw new IllegalArgumentException("asegurado, servicio, desde y hasta son obligatorios");
        }
        if (!desde.isBefore(hasta)) {
            throw new IllegalArgumentException("desde debe ser anterior a hasta");
        }
        return this.autorizacionRepository.contarSesiones(aseguradoId, codigoServicio, desde, hasta);
    }
}
