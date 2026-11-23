package com.nicky.pruebatecnica.domain.model.exception;

/** El documento no corresponde a un asegurado de la póliza. No incluye el documento en el mensaje. */
public class AseguradoNoEncontradoException extends RuntimeException {

    public AseguradoNoEncontradoException() {
        super("El documento no corresponde a un asegurado de la póliza");
    }
}
