package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;

import com.nicky.pruebatecnica.domain.model.Asegurado;
import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.Complejidad;
import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.PlanSalud;
import com.nicky.pruebatecnica.domain.model.vo.RangoDia;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.domain.model.exception.AseguradoNoEncontradoException;
import com.nicky.pruebatecnica.domain.model.exception.EnCarenciaException;
import com.nicky.pruebatecnica.domain.model.exception.ServicioNoEnTarifarioException;
import com.nicky.pruebatecnica.domain.model.gateway.AseguradoRepository;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;
import com.nicky.pruebatecnica.domain.model.gateway.TarifarioRepository;
import com.nicky.pruebatecnica.domain.service.AnioPoliza;
import com.nicky.pruebatecnica.domain.service.LiquidadorPago;

public class RegistrarAutorizacionUseCase {

    private final AseguradoRepository aseguradoRepository;
    private final AutorizacionRepository autorizacionRepository;
    private final TarifarioRepository tarifarioRepository;
    private final PlanSalud plan;
    private final Clock clock;

    public RegistrarAutorizacionUseCase(AseguradoRepository aseguradoRepository,
            AutorizacionRepository autorizacionRepository,
            TarifarioRepository tarifarioRepository,
            PlanSalud plan,
            Clock clock) {
        this.aseguradoRepository = aseguradoRepository;
        this.autorizacionRepository = autorizacionRepository;
        this.tarifarioRepository = tarifarioRepository;
        this.plan = plan;
        this.clock = clock;
    }

    public Autorizacion execute(RegistrarAutorizacionComando comando) {
        ServicioAutorizado servicio = tarifarioRepository
                .buscarServicio(comando.sede(), comando.codigoServicio())
                .orElseThrow(() -> new ServicioNoEnTarifarioException(comando.codigoServicio()));

        Asegurado asegurado = aseguradoRepository
                .buscarPorDocumentoConBloqueo(comando.documentoAsegurado())
                .orElseThrow(AseguradoNoEncontradoException::new);

        Instant ahora = clock.instant();
        LocalDate hoy = ahora.atZone(RangoDia.ZONA_COLOMBIA).toLocalDate();

        verificarCarencia(asegurado, servicio, hoy);

        LocalDate inicioAnio = AnioPoliza.inicioVigente(asegurado.fechaIngreso(), hoy);
        long acumulado = acumuladoDelAnio(asegurado, inicioAnio);

        long valor = servicio.valorUnitario() * comando.cantidad();
        Liquidacion liquidacion = LiquidadorPago.liquidar(plan, valor, acumulado);

        return autorizacionRepository.guardar(Autorizacion.nueva(
                asegurado.id(), asegurado.documentoEnmascarado(), comando.sede(),
                servicio, comando.cantidad(), liquidacion, ahora));
    }

    private void verificarCarencia(Asegurado asegurado, ServicioAutorizado servicio, LocalDate hoy) {
        if (servicio.complejidad() != Complejidad.ALTA) {
            return;
        }
        LocalDate disponibleDesde = asegurado.fechaIngreso().plusDays(plan.carenciaDias());
        if (hoy.isBefore(disponibleDesde)) {
            throw new EnCarenciaException(disponibleDesde);
        }
    }

    private long acumuladoDelAnio(Asegurado asegurado, LocalDate inicioAnio) {
        long otrosCanales = inicioAnio.equals(asegurado.anioPolizaInicio()) ? asegurado.pagosOtrosCanales() : 0L;
        Instant desde = inicioAnio.atStartOfDay(RangoDia.ZONA_COLOMBIA).toInstant();
        Instant hasta = inicioAnio.plusYears(1).atStartOfDay(RangoDia.ZONA_COLOMBIA).toInstant();
        return otrosCanales + autorizacionRepository.sumarPagosAsegurado(asegurado.id(), desde, hasta);
    }
}
