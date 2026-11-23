package com.nicky.pruebatecnica.domain.model.gateway;

import java.time.Instant;
import java.util.List;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;

public interface AutorizacionRepository {
    Autorizacion guardar(Autorizacion autorizacion);

    long sumarPagosAsegurado(Long aseguradoId, Instant desde, Instant hasta);

    long contarSesiones(Long aseguradoId, String codigoServicio, Instant desde, Instant hasta);

    List<Autorizacion> listarDelDia(String sede, Instant desde, Instant hasta, int pagina, int tamano);

    ResumenDia resumenDelDia(String sede, Instant desde, Instant hasta);
}