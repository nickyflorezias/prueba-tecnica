package com.nicky.pruebatecnica.domain.usecase.asegurado;
import com.nicky.pruebatecnica.domain.model.Asegurado;
import com.nicky.pruebatecnica.domain.model.gateway.AseguradoRepository;
public class BuscarPorDocumentoConBloqueo {
    private final AseguradoRepository repository;
    public BuscarPorDocumentoConBloqueo(AseguradoRepository repository) {
        this.repository = repository;
    }
    public Asegurado execute(String documento) {
        return this.repository.buscarPorDocumentoConBloqueo(documento)
                .orElseThrow(() -> new IllegalArgumentException("No se encontró asegurado con ese numero de documento"));
    }
}
