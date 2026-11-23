package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.mapper;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo.AutorizacionDbo;
import org.springframework.stereotype.Component;

@Component
public class AutorizacionMapper {

    public Autorizacion toDomain(AutorizacionDbo e) {
        return new Autorizacion(
                e.getId(), e.getAseguradoId(), e.getAseguradoEnmascarado(), e.getSede(),
                new ServicioAutorizado(e.getCodigoServicio(), e.getNombreServicio(),
                        e.getComplejidad(), e.getValorUnitario()),
                e.getCantidad(),
                new Liquidacion(e.getValor(), e.getDeducible(), e.getCoaseguro(),
                        e.getPagoAsegurado(), e.getPagoAseguradora()),
                e.getFechaHora());
    }

    public AutorizacionDbo toEntity(Autorizacion a) {
        var s = a.servicio();
        var l = a.liquidacion();
        return AutorizacionDbo.builder()
                .id(a.id()).aseguradoId(a.aseguradoId()).aseguradoEnmascarado(a.aseguradoEnmascarado()).sede(a.sede())
                .codigoServicio(s.codigo()).nombreServicio(s.nombre())
                .complejidad(s.complejidad()).valorUnitario(s.valorUnitario())
                .cantidad(a.cantidad())
                .valor(l.valor()).deducible(l.deducible()).coaseguro(l.coaseguro())
                .pagoAsegurado(l.pagoAsegurado()).pagoAseguradora(l.pagoAseguradora())
                .fechaHora(a.fechaHora())
                .build();
    }
}
