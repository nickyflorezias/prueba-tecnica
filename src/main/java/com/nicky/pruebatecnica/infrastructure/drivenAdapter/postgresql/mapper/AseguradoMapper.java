package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.mapper;

import com.nicky.pruebatecnica.domain.model.Asegurado;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo.AseguradoDbo;
import org.springframework.stereotype.Component;

@Component
public class AseguradoMapper {
    public Asegurado toDomain(AseguradoDbo e) {
        return new Asegurado(
                e.getId(),
                e.getDocumento(),
                e.getFechaIngreso(),
                e.getAnioPolizaInicio(),
                e.getPagosOtrosCanales()
        );
    }
}
