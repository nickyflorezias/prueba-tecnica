package com.nicky.pruebatecnica.domain.model.gateway;

import java.util.Optional;

import com.nicky.pruebatecnica.domain.model.Asegurado;

public interface AseguradoRepository {
    Optional<Asegurado> buscarPorDocumentoConBloqueo(String documento);
}
