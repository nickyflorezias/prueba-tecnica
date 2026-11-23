package com.nicky.pruebatecnica.application.config;

import com.nicky.pruebatecnica.domain.model.vo.PlanSalud;
import com.nicky.pruebatecnica.domain.model.gateway.AseguradoRepository;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;
import com.nicky.pruebatecnica.domain.model.gateway.TarifarioRepository;
import com.nicky.pruebatecnica.domain.usecase.asegurado.BuscarPorDocumentoConBloqueo;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ContarSesionesUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ListarAutorizacionesDelDiaUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ResumenDelDiaUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.SumarPagosAseguradoUseCase;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
@EnableConfigurationProperties({PlanProperties.class, SedesProperties.class})
public class UseCaseConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    PlanSalud planSalud(PlanProperties p) {
        return new PlanSalud(p.deducible(), p.coaseguroPorcentaje(), p.topeDesembolso(), p.carenciaDias());
    }

    @Bean
    BuscarPorDocumentoConBloqueo buscarPorDocumentoConBloqueo(AseguradoRepository repository) {
        return new BuscarPorDocumentoConBloqueo(repository);
    }

    @Bean
    SumarPagosAseguradoUseCase sumarPagosAseguradoUseCase(AutorizacionRepository repository) {
        return new SumarPagosAseguradoUseCase(repository);
    }

    @Bean
    ContarSesionesUseCase contarSesionesUseCase(AutorizacionRepository repository) {
        return new ContarSesionesUseCase(repository);
    }

    @Bean
    ListarAutorizacionesDelDiaUseCase listarAutorizacionesDelDiaUseCase(AutorizacionRepository repository) {
        return new ListarAutorizacionesDelDiaUseCase(repository);
    }

    @Bean
    ResumenDelDiaUseCase resumenDelDiaUseCase(AutorizacionRepository repository) {
        return new ResumenDelDiaUseCase(repository);
    }

    @Bean
    RegistrarAutorizacionUseCase registrarAutorizacionUseCase(AseguradoRepository aseguradoRepository,
            AutorizacionRepository autorizacionRepository, TarifarioRepository tarifarioRepository,
            PlanSalud plan, Clock clock) {
        return new RegistrarAutorizacionUseCase(aseguradoRepository, autorizacionRepository,
                tarifarioRepository, plan, clock);
    }
}
