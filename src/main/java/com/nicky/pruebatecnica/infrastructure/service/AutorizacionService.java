package com.nicky.pruebatecnica.infrastructure.service;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.PaginaAutorizaciones;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ListarAutorizacionesDelDiaUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionComando;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ResumenDelDiaUseCase;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class AutorizacionService {

    private final RegistrarAutorizacionUseCase registrar;
    private final ListarAutorizacionesDelDiaUseCase listar;
    private final ResumenDelDiaUseCase resumen;
    private final Clock clock;

    public AutorizacionService(RegistrarAutorizacionUseCase registrar,
                               ListarAutorizacionesDelDiaUseCase listar,
                               ResumenDelDiaUseCase resumen,
                               Clock clock) {
        this.registrar = registrar;
        this.listar = listar;
        this.resumen = resumen;
        this.clock = clock;
    }

    @Transactional
    public Autorizacion registrar(RegistrarAutorizacionComando comando) {
        return registrar.execute(comando);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public PaginaAutorizaciones consultarDelDia(String sede, LocalDate fecha, int pagina, int tamano) {
        Instant calculadoEn = clock.instant();
        List<Autorizacion> items = listar.execute(sede, fecha, pagina, tamano);
        ResumenDia totales = resumen.execute(sede, fecha);
        return new PaginaAutorizaciones(items, totales, calculadoEn);
    }
}
