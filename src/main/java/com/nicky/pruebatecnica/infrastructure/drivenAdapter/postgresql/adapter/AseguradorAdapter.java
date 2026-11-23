package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.adapter;

import com.nicky.pruebatecnica.domain.model.Asegurado;
import com.nicky.pruebatecnica.domain.model.gateway.AseguradoRepository;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.mapper.AseguradoMapper;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.repository.AseguradoRepositoryJpa;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AseguradorAdapter implements AseguradoRepository {

    private final AseguradoRepositoryJpa repository;
    private final AseguradoMapper mapper;

    public AseguradorAdapter(AseguradoRepositoryJpa repository, AseguradoMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public Optional<Asegurado> buscarPorDocumentoConBloqueo(String documento) {
        return repository.findByDocumentoForUpdate(documento)
                .map(mapper::toDomain);
    }
}
