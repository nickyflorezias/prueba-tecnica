package com.nicky.pruebatecnica.domain.model.exception;

/** El código de servicio no está en el tarifario convenido de la sede. */
public class ServicioNoEnTarifarioException extends RuntimeException {

    public ServicioNoEnTarifarioException(String codigoServicio) {
        super("El servicio " + codigoServicio + " no está en el tarifario de la sede");
    }
}
