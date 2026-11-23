package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.adapter;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.mapper.AutorizacionMapper;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.repository.AutorizacionRepositoryJpa;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

@Component
public class AutorizacionAdapter implements AutorizacionRepository {

    private final AutorizacionRepositoryJpa autorizacionRepositoryJpa;
    private final AutorizacionMapper mapper;

    public AutorizacionAdapter(AutorizacionRepositoryJpa autorizacionRepositoryJpa, AutorizacionMapper mapper) {
        this.autorizacionRepositoryJpa = autorizacionRepositoryJpa;
        this.mapper = mapper;
    }

    @Override
    public Autorizacion guardar(Autorizacion autorizacion) {
        return mapper.toDomain(autorizacionRepositoryJpa.save(mapper.toEntity(autorizacion)));
    }

    @Override
    public long sumarPagosAsegurado(Long aseguradoId, Instant desde, Instant hasta) {
        return autorizacionRepositoryJpa.sumarPagosAsegurado(aseguradoId, desde, hasta);
    }

    @Override
    public long contarSesiones(Long aseguradoId, String codigoServicio, Instant desde, Instant hasta) {
        return autorizacionRepositoryJpa.contarSesiones(aseguradoId, codigoServicio, desde, hasta);
    }

    @Override
    public List<Autorizacion> listarDelDia(String sede, Instant desde, Instant hasta, int pagina, int tamano) {
        return autorizacionRepositoryJpa
                .listarDelDia(sede, desde, hasta, PageRequest.of(pagina - 1, tamano))
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public ResumenDia resumenDelDia(String sede, Instant desde, Instant hasta) {
        var r = autorizacionRepositoryJpa.resumenDelDia(sede, desde, hasta);
        return new ResumenDia(r.getTotal(), r.getValorTotal(), r.getRecaudoEsperado());
    }
}
