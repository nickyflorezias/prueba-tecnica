package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import com.nicky.pruebatecnica.domain.model.Asegurado;
import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.Complejidad;
import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.PlanSalud;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.domain.model.exception.AseguradoNoEncontradoException;
import com.nicky.pruebatecnica.domain.model.exception.EnCarenciaException;
import com.nicky.pruebatecnica.domain.model.exception.ServicioNoEnTarifarioException;
import com.nicky.pruebatecnica.domain.model.gateway.AseguradoRepository;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;
import com.nicky.pruebatecnica.domain.model.gateway.TarifarioRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RegistrarAutorizacionUseCaseTest {

    private static final String SEDE = "IPS-0412";
    private static final PlanSalud PLAN = new PlanSalud(350_000, 15, 1_800_000, 90);

    /** Las seis solicitudes del 19-nov-2026, en orden, contra los datos de ejemplo del enunciado. */
    @Test
    void lasSeisSolicitudesDelDiaEnOrden() {
        var f = new Fixture();

        // S1: 43876521, resonancia (alta). Le quedan 100.000 de tope, el coaseguro natural sería 142.245.
        var s1 = f.registrar("2026-11-19T08:05", "43876521", "883101", 1);
        assertPago(s1, 948_300, 0, 100_000, 100_000, 848_300);
        assertThat(s1.aseguradoEnmascarado()).isEqualTo("XXXX6521");

        // S2: 1036654782 ingresó el 2026-09-10: carencia hasta el 2026-12-09.
        assertThatThrownBy(() -> f.registrar("2026-11-19T08:20", "1036654782", "883101", 1))
                .isInstanceOfSatisfying(EnCarenciaException.class,
                        e -> assertThat(e.getDisponibleDesde()).isEqualTo(LocalDate.parse("2026-12-09")));

        // S3: 71234890, 4 sesiones. La autorización del 2025-11-19 es del año anterior y no cuenta.
        var s3 = f.registrar("2026-11-19T08:40", "71234890", "931000", 4);
        assertPago(s3, 191_752, 134_124, 8_644, 142_768, 48_984);

        // S4: 32557019, sin pagos previos: deducible completo más coaseguro.
        var s4 = f.registrar("2026-11-19T09:10", "32557019", "883101", 1);
        assertPago(s4, 948_300, 350_000, 89_745, 439_745, 508_555);

        // S5: 43876521 otra vez. S1 llevó el acumulado al tope: paga 0 (sin S1 pagaría 16.860).
        var s5 = f.registrar("2026-11-19T09:30", "43876521", "890264", 1);
        assertPago(s5, 112_400, 0, 0, 0, 112_400);

        // S6: otros canales ya superan el tope: el restante es 0, no negativo.
        var s6 = f.registrar("2026-11-19T10:00", "1128450032", "890201", 1);
        assertPago(s6, 58_700, 0, 0, 0, 58_700);

        // Recaudo esperado del día = S1 + S3 + S4 + S5 + S6 (S2 no se registró).
        long recaudo = List.of(s1, s3, s4, s5, s6).stream()
                .mapToLong(a -> a.liquidacion().pagoAsegurado()).sum();
        assertThat(recaudo).isEqualTo(682_513);
    }

    @Test
    void carenciaTerminaElDiaNoventaInclusive() {
        var f = new Fixture();
        // Ingreso 2026-09-10 + 90 días = 2026-12-09.
        assertThatThrownBy(() -> f.registrar("2026-12-08T23:59", "1036654782", "883101", 1))
                .isInstanceOf(EnCarenciaException.class);
        assertThat(f.registrar("2026-12-09T00:00", "1036654782", "883101", 1)).isNotNull();
    }

    @Test
    void carenciaNoAplicaAComplejidadBaja() {
        var f = new Fixture();
        var a = f.registrar("2026-11-19T08:20", "1036654782", "890201", 1);
        assertPago(a, 58_700, 58_700, 0, 58_700, 0);
    }

    @Test
    void servicioFueraDelTarifarioDeLaSede() {
        var f = new Fixture();
        assertThatThrownBy(() -> f.registrar("2026-11-19T08:05", "43876521", "999999", 1))
                .isInstanceOf(ServicioNoEnTarifarioException.class);
    }

    @Test
    void documentoQueNoEsAsegurado() {
        var f = new Fixture();
        assertThatThrownBy(() -> f.registrar("2026-11-19T08:05", "99999999", "890201", 1))
                .isInstanceOf(AseguradoNoEncontradoException.class);
    }

    @Test
    void laHoraDeColombiaDefineElDiaAunqueSeaOtroDiaEnUtc() {
        var f = new Fixture();
        // 2026-11-19 21:30 en Colombia es 2026-11-20 02:30 UTC. 71234890 renueva el 11-20: sigue en el año 2025-11-20.
        var a = f.registrar("2026-11-19T21:30", "71234890", "931000", 1);
        // Acumulado 215.876 (120.000 + 95.876 de junio): faltan 134.124 de deducible, el servicio vale 47.938.
        assertPago(a, 47_938, 47_938, 0, 47_938, 0);
    }

    @Test
    void pagosDeOtrosCanalesDeUnAnioAnteriorNoCuentan() {
        var f = new Fixture();
        // 43876521 renovó el 2026-03-01 pero su dato de otros canales es del año 2025-03-01 (desactualizado).
        f.aseguradoConAnioDesactualizado();
        var a = f.registrar("2026-11-19T08:05", "43876521", "883101", 1);
        // Acumulado 0 en este año: deducible 350.000 + coaseguro 15 % de 598.300.
        assertPago(a, 948_300, 350_000, 89_745, 439_745, 508_555);
    }

    // ---------- LiquidadorPago ----------

    @Test
    void coaseguroRedondeaAlPesoMasCercanoMitadHaciaArriba() {
        // Deducible completo; coaseguro de 10 pesos = 1,5 -> 2; de 30 = 4,5 -> 5; de 3 = 0,45 -> 0.
        assertThat(com.nicky.pruebatecnica.domain.service.LiquidadorPago.liquidar(PLAN, 10, 350_000)
                .coaseguro()).isEqualTo(2);
        assertThat(com.nicky.pruebatecnica.domain.service.LiquidadorPago.liquidar(PLAN, 30, 350_000)
                .coaseguro()).isEqualTo(5);
        assertThat(com.nicky.pruebatecnica.domain.service.LiquidadorPago.liquidar(PLAN, 3, 350_000)
                .coaseguro()).isEqualTo(0);
    }

    @Test
    void servicioMasBaratoQueElDeduciblePendienteSePagaCompleto() {
        var l = com.nicky.pruebatecnica.domain.service.LiquidadorPago.liquidar(PLAN, 58_700, 0);
        assertThat(l.deducible()).isEqualTo(58_700);
        assertThat(l.coaseguro()).isZero();
        assertThat(l.pagoAseguradora()).isZero();
    }

    @Test
    void alAlcanzarElTopeLaAseguradoraPagaTodo() {
        var l = com.nicky.pruebatecnica.domain.service.LiquidadorPago.liquidar(PLAN, 112_400, 1_800_000);
        assertThat(l.pagoAsegurado()).isZero();
        assertThat(l.pagoAseguradora()).isEqualTo(112_400);
    }

    // ---------- utilidades ----------

    private static void assertPago(Autorizacion a, long valor, long deducible, long coaseguro,
                                   long pagoAsegurado, long pagoAseguradora) {
        Liquidacion l = a.liquidacion();
        assertThat(l.valor()).as("valor").isEqualTo(valor);
        assertThat(l.deducible()).as("deducible").isEqualTo(deducible);
        assertThat(l.coaseguro()).as("coaseguro").isEqualTo(coaseguro);
        assertThat(l.pagoAsegurado()).as("pago asegurado").isEqualTo(pagoAsegurado);
        assertThat(l.pagoAseguradora()).as("pago aseguradora").isEqualTo(pagoAseguradora);
    }

    /** Datos de ejemplo del enunciado con repositorios en memoria. */
    private static class Fixture {
        final Map<String, Asegurado> asegurados = new java.util.HashMap<>(Map.of(
                "43876521", new Asegurado(1L, "43876521", LocalDate.parse("2019-03-01"), LocalDate.parse("2026-03-01"), 1_700_000L),
                "1036654782", new Asegurado(2L, "1036654782", LocalDate.parse("2026-09-10"), LocalDate.parse("2026-09-10"), 0L),
                "71234890", new Asegurado(3L, "71234890", LocalDate.parse("2015-11-20"), LocalDate.parse("2025-11-20"), 120_000L),
                "32557019", new Asegurado(4L, "32557019", LocalDate.parse("2024-08-25"), LocalDate.parse("2026-08-25"), 0L),
                "1128450032", new Asegurado(5L, "1128450032", LocalDate.parse("2021-07-14"), LocalDate.parse("2026-07-14"), 1_950_000L)));

        final List<Autorizacion> guardadas = new ArrayList<>();
        final MutableClock clock = new MutableClock();
        final RegistrarAutorizacionUseCase useCase;

        Fixture() {
            var baja = Complejidad.BAJA;
            // Historial previo del enunciado (instantes UTC de la hora de Colombia).
            guardadas.add(historial(1L, 1L, "43876521", "890264", "Consulta de medicina especializada", baja, 112_400, 1, 0, 16_860, "2026-02-27T15:15:00Z", SEDE));
            guardadas.add(historial(2L, 3L, "71234890", "890201", "Consulta de medicina general", baja, 58_700, 1, 58_700, 0, "2025-11-20T02:30:00Z", "IPS-0188"));
            guardadas.add(historial(3L, 3L, "71234890", "931000", "Sesión de terapia física", baja, 47_938, 2, 95_876, 0, "2026-06-10T15:20:00Z", SEDE));

            AseguradoRepository aseguradoRepo = documento -> Optional.ofNullable(asegurados.get(documento));
            TarifarioRepository tarifario = (sede, codigo) -> !SEDE.equals(sede) ? Optional.empty() : Optional.ofNullable(Map.of(
                    "890201", new ServicioAutorizado("890201", "Consulta de medicina general", Complejidad.BAJA, 58_700),
                    "890264", new ServicioAutorizado("890264", "Consulta de medicina especializada", Complejidad.BAJA, 112_400),
                    "931000", new ServicioAutorizado("931000", "Sesión de terapia física", Complejidad.BAJA, 47_938),
                    "883101", new ServicioAutorizado("883101", "Resonancia magnética de columna", Complejidad.ALTA, 948_300)
            ).get(codigo));
            useCase = new RegistrarAutorizacionUseCase(aseguradoRepo, new EnMemoria(), tarifario, PLAN, clock);
        }

        void aseguradoConAnioDesactualizado() {
            asegurados.put("43876521", new Asegurado(1L, "43876521", LocalDate.parse("2019-03-01"),
                    LocalDate.parse("2025-03-01"), 1_700_000L));
            guardadas.removeIf(a -> a.aseguradoId() == 1L);
        }

        Autorizacion registrar(String horaColombia, String documento, String servicio, int cantidad) {
            clock.fijar(LocalDate.parse(horaColombia.substring(0, 10)).atTime(
                    java.time.LocalTime.parse(horaColombia.substring(11))).toInstant(ZoneOffset.ofHours(-5)));
            return useCase.execute(new RegistrarAutorizacionComando(documento, servicio, cantidad, SEDE));
        }

        private static Autorizacion historial(long id, long aseguradoId, String doc, String codigo, String nombre,
                                              Complejidad c, long unit, int cant, long ded, long coa, String instante, String sede) {
            long pago = ded + coa;
            return new Autorizacion(id, aseguradoId, "XXXX" + doc.substring(doc.length() - 4), sede,
                    new ServicioAutorizado(codigo, nombre, c, unit), cant,
                    new Liquidacion(unit * cant, ded, coa, pago, unit * cant - pago), Instant.parse(instante));
        }

        private class EnMemoria implements AutorizacionRepository {
            private long siguiente = 100;

            @Override
            public Autorizacion guardar(Autorizacion a) {
                var guardada = new Autorizacion(siguiente++, a.aseguradoId(), a.aseguradoEnmascarado(), a.sede(),
                        a.servicio(), a.cantidad(), a.liquidacion(), a.fechaHora());
                guardadas.add(guardada);
                return guardada;
            }

            @Override
            public long sumarPagosAsegurado(Long aseguradoId, Instant desde, Instant hasta) {
                return guardadas.stream()
                        .filter(a -> a.aseguradoId().equals(aseguradoId))
                        .filter(a -> !a.fechaHora().isBefore(desde) && a.fechaHora().isBefore(hasta))
                        .mapToLong(a -> a.liquidacion().pagoAsegurado()).sum();
            }

            @Override
            public long contarSesiones(Long aseguradoId, String codigoServicio, Instant desde, Instant hasta) {
                throw new UnsupportedOperationException();
            }

            @Override
            public List<Autorizacion> listarDelDia(String sede, Instant desde, Instant hasta, int pagina, int tamano) {
                throw new UnsupportedOperationException();
            }

            @Override
            public ResumenDia resumenDelDia(String sede, Instant desde, Instant hasta) {
                throw new UnsupportedOperationException();
            }
        }
    }

    private static class MutableClock extends Clock {
        private Instant ahora = Instant.EPOCH;

        void fijar(Instant instante) {
            this.ahora = instante;
        }

        @Override
        public java.time.ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return ahora;
        }
    }
}
