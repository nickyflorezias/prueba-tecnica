package com.nicky.pruebatecnica.infrastructure.logging;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.Complejidad;
import com.nicky.pruebatecnica.domain.model.exception.EnCarenciaException;
import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.PaginaAutorizaciones;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionComando;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.ApiExceptionHandler;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.AutorizacionController;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.mapper.AutorizacionWebMapper;
import com.nicky.pruebatecnica.application.config.SecurityConfig;
import com.nicky.pruebatecnica.infrastructure.service.AutorizacionService;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

/** Los logs siguen el formato de la v1 y nunca contienen el documento completo ni el token. */
@WebMvcTest(AutorizacionController.class)
@Import({SecurityConfig.class, AutorizacionWebMapper.class, ApiExceptionHandler.class, RegistroPeticionFilter.class})
@TestPropertySource(properties = "security.jwt.secret=" + RegistroPeticionTest.SECRETO)
@ExtendWith(OutputCaptureExtension.class)
class RegistroPeticionTest {

    static final String SECRETO = "secreto-de-prueba-con-mas-de-32-caracteres-ok";
    private static final String URL = "/api/v1/autorizaciones";
    private static final String PREFIJO = "\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2} api (INFO|WARN|ERROR) +";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AutorizacionService service;

    @Test
    void postExitosoRegistraUnaLineaConFormatoDeLaV1(CapturedOutput salida) throws Exception {
        when(service.registrar(any(RegistrarAutorizacionComando.class))).thenReturn(autorizacion());
        String token = token("AUXILIAR_ADMISION", "IPS-0412");

        mvc.perform(post(URL).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"documento_asegurado\":\"43876521\",\"codigo_servicio\":\"883101\",\"cantidad\":1}"));

        assertThat(salida.getOut()).containsPattern(PREFIJO + "POST /api/v1/autorizaciones 201 dur=\\d+ms "
                + "usuario=usuario1 rol=AUXILIAR_ADMISION sede=IPS-0412 id=AU-000123 asegurado=XXXX6521 "
                + "servicio=883101 cantidad=1 pago_asegurado=100000 pago_aseguradora=848300");
        assertNoHayDatosSensibles(salida, "43876521", token);
    }

    @Test
    void getRegistraTotalYPrimeroUltimoComoEnLaV1(CapturedOutput salida) throws Exception {
        when(service.consultarDelDia(any(), any(), org.mockito.ArgumentMatchers.anyInt(), org.mockito.ArgumentMatchers.anyInt()))
                .thenReturn(new PaginaAutorizaciones(List.of(autorizacion()), new ResumenDia(1, 948300, 100000),
                        Instant.parse("2026-11-19T23:40:00Z")));

        mvc.perform(get(URL + "?fecha=2026-11-19&pagina=1&tamano=50")
                .header("Authorization", "Bearer " + token("AUXILIAR_CAJA", "IPS-0412")));

        assertThat(salida.getOut()).containsPattern(PREFIJO
                + "GET /api/v1/autorizaciones\\?fecha=2026-11-19&pagina=1&tamano=50 200 dur=\\d+ms "
                + "usuario=usuario1 rol=AUXILIAR_CAJA sede=IPS-0412 total=1 recaudo_esperado=100000 "
                + "primero=AU-000123 ultimo=AU-000123");
    }

    @Test
    void solicitudInvalidaRegistraLosCamposPeroNoSusValores(CapturedOutput salida) throws Exception {
        String token = token("AUXILIAR_ADMISION", "IPS-0412");

        mvc.perform(post(URL).header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"documento_asegurado\":\"abc12345\",\"codigo_servicio\":\"883101\",\"cantidad\":11}"));

        assertThat(salida.getOut()).containsPattern(PREFIJO + "POST /api/v1/autorizaciones 400 dur=\\d+ms "
                + "usuario=usuario1 rol=AUXILIAR_ADMISION sede=IPS-0412 "
                + "motivo=SOLICITUD_INVALIDA campos=\\[documento_asegurado, cantidad\\]");
        assertNoHayDatosSensibles(salida, "abc12345", token);
    }

    @Test
    void carenciaRegistraElMotivoYLaFecha(CapturedOutput salida) throws Exception {
        when(service.registrar(any())).thenThrow(new EnCarenciaException(LocalDate.parse("2026-12-09")));

        mvc.perform(post(URL).header("Authorization", "Bearer " + token("AUXILIAR_ADMISION", "IPS-0412"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"documento_asegurado\":\"1036654782\",\"codigo_servicio\":\"883101\",\"cantidad\":1}"));

        assertThat(salida.getOut()).containsPattern(PREFIJO + "POST /api/v1/autorizaciones 409 dur=\\d+ms "
                + "usuario=usuario1 rol=AUXILIAR_ADMISION sede=IPS-0412 motivo=EN_CARENCIA disponible_desde=2026-12-09");
        assertThat(salida.getOut()).doesNotContain("1036654782");
    }

    @Test
    void sinTokenSeRegistraComo401SinUsuario(CapturedOutput salida) throws Exception {
        mvc.perform(get(URL + "?fecha=2026-11-19"));

        assertThat(salida.getOut()).containsPattern("api WARN +GET /api/v1/autorizaciones\\?fecha=2026-11-19 401 "
                + "dur=\\d+ms usuario=- rol=- sede=-");
    }

    @Test
    void cajaQueIntentaRegistrarQuedaComo403ConSuUsuario(CapturedOutput salida) throws Exception {
        mvc.perform(post(URL).header("Authorization", "Bearer " + token("AUXILIAR_CAJA", "IPS-0412"))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"documento_asegurado\":\"43876521\",\"codigo_servicio\":\"883101\",\"cantidad\":1}"));

        assertThat(salida.getOut()).containsPattern("api WARN +POST /api/v1/autorizaciones 403 dur=\\d+ms "
                + "usuario=usuario1 rol=AUXILIAR_CAJA sede=IPS-0412");
        assertThat(salida.getOut()).doesNotContain("43876521");
    }

    @Test
    void saltosDeLineaNoPermitenFalsificarEntradasDelLog() {
        assertThat(DetalleLog.limpiar("a\nINFO falso\r\tb")).isEqualTo("a_INFO falso__b");
        assertThat(DetalleLog.limpiar("x".repeat(400))).hasSize(303).endsWith("...");
    }

    private static void assertNoHayDatosSensibles(CapturedOutput salida, String dato, String token) {
        assertThat(salida.getOut()).doesNotContain(dato).doesNotContain(token).doesNotContain("Bearer");
    }

    private static Autorizacion autorizacion() {
        return new Autorizacion(123L, 1L, "XXXX6521", "IPS-0412",
                new ServicioAutorizado("883101", "Resonancia magnética de columna", Complejidad.ALTA, 948300),
                1, new Liquidacion(948300, 0, 100000, 100000, 848300), Instant.parse("2026-11-19T13:05:00Z"));
    }

    private static String token(String rol, String sede) throws Exception {
        var claims = new JWTClaimsSet.Builder().subject("usuario1").claim("rol", rol).claim("sede", sede)
                .expirationTime(Date.from(Instant.now().plusSeconds(180))).build();
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(SECRETO.getBytes()));
        return jwt.serialize();
    }
}
