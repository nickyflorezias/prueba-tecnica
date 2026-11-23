package com.nicky.pruebatecnica.domain.model.gateway;

import java.util.Optional;

import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;

public interface TarifarioRepository {

    /** Servicio del tarifario convenido de la sede, o vacío si la sede no lo tiene. */
    Optional<ServicioAutorizado> buscarServicio(String sede, String codigoServicio);
}
