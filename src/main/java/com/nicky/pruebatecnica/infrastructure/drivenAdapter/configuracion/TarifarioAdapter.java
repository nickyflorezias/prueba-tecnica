package com.nicky.pruebatecnica.infrastructure.drivenAdapter.configuracion;

import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.domain.model.gateway.TarifarioRepository;
import com.nicky.pruebatecnica.application.config.SedesProperties;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class TarifarioAdapter implements TarifarioRepository {

    private final SedesProperties sedes;

    public TarifarioAdapter(SedesProperties sedes) {
        this.sedes = sedes;
    }

    @Override
    public Optional<ServicioAutorizado> buscarServicio(String sede, String codigoServicio) {
        return Optional.ofNullable(sedes.get(sede))
                .map(SedesProperties.Sede::tarifario)
                .map(tarifario -> tarifario.get(codigoServicio))
                .map(s -> new ServicioAutorizado(codigoServicio, s.nombre(), s.complejidad(), s.valor()));
    }
}
