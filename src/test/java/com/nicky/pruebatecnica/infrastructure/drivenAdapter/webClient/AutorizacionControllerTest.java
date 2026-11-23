package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.Complejidad;
import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.PaginaAutorizaciones;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.model.vo.ServicioAutorizado;
import com.nicky.pruebatecnica.domain.model.exception.AseguradoNoEncontradoException;
import com.nicky.pruebatecnica.domain.model.exception.EnCarenciaException;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionComando;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.mapper.AutorizacionWebMapper;
import com.nicky.pruebatecnica.application.config.SecurityConfig;
import com.nicky.pruebatecnica.infrastructure.service.AutorizacionService;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AutorizacionController.class)
@Import({SecurityConfig.class, AutorizacionWebMapper.class, ApiExceptionHandler.class})
@org.springframework.test.context.TestPropertySource(properties =
        "security.jwt.secret=" + AutorizacionControllerTest.SECRETO)
class AutorizacionControllerTest {

    static final String SECRETO = "secreto-de-prueba-con-mas-de-32-caracteres-ok";
    private static final String URL = "/api/v1/autorizaciones";

    @Autowired
    MockMvc mvc;

    @MockitoBean
    AutorizacionService service;

    // ---------- token ----------

    @Test
    void sinTokenResponde401() throws Exception {
        mvc.perform(get(URL).param("fecha", "2026-11-19")).andExpect(status().isUnauthorized());
    }

    @Test
    void tokenFirmadoConOtroSecretoResponde401() throws Exception {
        String token = token("otro-secreto-distinto-de-mas-de-32-caracteres", "AUXILIAR_CAJA", "IPS-0412", futuro());
        mvc.perform(get(URL).param("fecha", "2026-11-19").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenExpiradoResponde401() throws Exception {
        String token = token(SECRETO, "AUXILIAR_CAJA", "IPS-0412", Instant.now().minusSeconds(600));
        mvc.perform(get(URL).param("fecha", "2026-11-19").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenSinSedeResponde401() throws Exception {
        String token = token(SECRETO, "AUXILIAR_CAJA", null, futuro());
        mvc.perform(get(URL).param("fecha", "2026-11-19").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenConRolDesconocidoResponde401() throws Exception {
        String token = token(SECRETO, "ADMINISTRADOR", "IPS-0412", futuro());
        mvc.perform(get(URL).param("fecha", "2026-11-19").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void cajaNoPuedeRegistrar() throws Exception {
        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_CAJA", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("43876521", "883101", "1")))
                .andExpect(status().isForbidden());
    }

    // ---------- GET ----------

    @Test
    void cajaListaConLaSedeDelToken() throws Exception {
        when(service.consultarDelDia(eq("IPS-0412"), eq(LocalDate.parse("2026-11-19")), eq(1), eq(50)))
                .thenReturn(new PaginaAutorizaciones(List.of(autorizacion()),
                        new ResumenDia(1, 948300, 100000), Instant.parse("2026-11-19T23:40:00Z")));

        mvc.perform(get(URL).param("fecha", "2026-11-19")
                        .header("Authorization", bearer("AUXILIAR_CAJA", "IPS-0412")))
                .andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", org.hamcrest.Matchers.containsString("no-store")))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.valor_total").value(948300))
                .andExpect(jsonPath("$.recaudo_esperado").value(100000))
                .andExpect(jsonPath("$.calculado_en").value("2026-11-19T18:40:00-05:00"))
                .andExpect(jsonPath("$.items[0].id").value("AU-000123"))
                .andExpect(jsonPath("$.items[0].asegurado_enmascarado").value("XXXX6521"))
                .andExpect(jsonPath("$.items[0].servicio.complejidad").value("alta"))
                .andExpect(jsonPath("$.items[0].pago_asegurado").value(100000))
                .andExpect(jsonPath("$.items[0].fecha_hora").value("2026-11-19T08:05:00-05:00"));
    }

    @Test
    void tamanoMayorAlMaximoResponde400() throws Exception {
        mvc.perform(get(URL).param("fecha", "2026-11-19").param("tamano", "51")
                        .header("Authorization", bearer("AUXILIAR_CAJA", "IPS-0412")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("tamano"));
    }

    @Test
    void fechaConFormatoInvalidoResponde400() throws Exception {
        mvc.perform(get(URL).param("fecha", "19/11/2026")
                        .header("Authorization", bearer("AUXILIAR_CAJA", "IPS-0412")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("fecha"));
    }

    @Test
    void faltaLaFechaResponde400() throws Exception {
        mvc.perform(get(URL).header("Authorization", bearer("AUXILIAR_CAJA", "IPS-0412")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("fecha"));
    }

    // ---------- POST ----------

    @Test
    void admisionRegistraYRecibe201() throws Exception {
        when(service.registrar(any(RegistrarAutorizacionComando.class))).thenReturn(autorizacion());

        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("43876521", "883101", "1")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("AU-000123"))
                .andExpect(jsonPath("$.asegurado_enmascarado").value("XXXX6521"))
                .andExpect(jsonPath("$.pago_aseguradora").value(848300));

        verify(service).registrar(new RegistrarAutorizacionComando("43876521", "883101", 1, "IPS-0412"));
    }

    @Test
    void sedeDelCuerpoSeIgnoraYSeUsaLaDelToken() throws Exception {
        when(service.registrar(any(RegistrarAutorizacionComando.class))).thenReturn(autorizacion());

        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"documento_asegurado\":\"43876521\",\"codigo_servicio\":\"883101\","
                                + "\"cantidad\":1,\"sede\":\"IPS-0188\"}"))
                .andExpect(status().isCreated());

        verify(service).registrar(new RegistrarAutorizacionComando("43876521", "883101", 1, "IPS-0412"));
    }

    @Test
    void cuerpoInvalidoIndicaCadaCampoEnSnakeCase() throws Exception {
        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("123", "883101", "11")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[?(@.campo=='documento_asegurado')]").exists())
                .andExpect(jsonPath("$.errores[?(@.campo=='cantidad')]").exists())
                .andExpect(jsonPath("$.errores[?(@.campo=='codigo_servicio')]").doesNotExist());
    }

    @Test
    void cantidadDecimalSeRechazaEnVezDeTruncarse() throws Exception {
        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"documento_asegurado\":\"43876521\",\"codigo_servicio\":\"883101\",\"cantidad\":1.5}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("cantidad"));
    }

    @Test
    void jsonRotoResponde400() throws Exception {
        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content("{no es json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errores[0].campo").value("cuerpo"));
    }

    @Test
    void aseguradoInexistenteResponde404SinEcoDelDocumento() throws Exception {
        when(service.registrar(any())).thenThrow(new AseguradoNoEncontradoException());

        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("99999999", "883101", "1")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.codigo").value("ASEGURADO_NO_ENCONTRADO"))
                .andExpect(jsonPath("$.mensaje").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("99999999"))));
    }

    @Test
    void enCarenciaResponde409ConFechaDisponible() throws Exception {
        when(service.registrar(any())).thenThrow(new EnCarenciaException(LocalDate.parse("2026-12-09")));

        mvc.perform(post(URL).header("Authorization", bearer("AUXILIAR_ADMISION", "IPS-0412"))
                        .contentType(MediaType.APPLICATION_JSON).content(cuerpo("1036654782", "883101", "1")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.codigo").value("EN_CARENCIA"))
                .andExpect(jsonPath("$.disponible_desde").value("2026-12-09"));
    }

    // ---------- utilidades ----------

    private static String cuerpo(String documento, String servicio, String cantidad) {
        return "{\"documento_asegurado\":\"" + documento + "\",\"codigo_servicio\":\"" + servicio
                + "\",\"cantidad\":" + cantidad + "}";
    }

    private static Autorizacion autorizacion() {
        return new Autorizacion(123L, 1L, "XXXX6521", "IPS-0412",
                new ServicioAutorizado("883101", "Resonancia magnética de columna", Complejidad.ALTA, 948300),
                1, new Liquidacion(948300, 0, 100000, 100000, 848300),
                Instant.parse("2026-11-19T13:05:00Z"));
    }

    private static Instant futuro() {
        return Instant.now().plusSeconds(180);
    }

    private static String bearer(String rol, String sede) throws Exception {
        return "Bearer " + token(SECRETO, rol, sede, futuro());
    }

    private static String token(String secreto, String rol, String sede, Instant expira) throws Exception {
        var claims = new JWTClaimsSet.Builder().subject("usuario1").expirationTime(Date.from(expira)).claim("rol", rol);
        if (sede != null) {
            claims.claim("sede", sede);
        }
        var jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims.build());
        jwt.sign(new MACSigner(secreto.getBytes()));
        return jwt.serialize();
    }
}
