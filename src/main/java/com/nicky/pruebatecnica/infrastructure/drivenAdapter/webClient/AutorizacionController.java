package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.PaginaAutorizaciones;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.ListarAutorizacionesDelDiaUseCase;
import com.nicky.pruebatecnica.domain.usecase.autorizacion.RegistrarAutorizacionComando;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.AutorizacionRequest;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.AutorizacionResponse;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ErroresResponse.ErrorCampo;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ListaAutorizacionesResponse;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.mapper.AutorizacionWebMapper;
import com.nicky.pruebatecnica.infrastructure.logging.DetalleLog;
import com.nicky.pruebatecnica.infrastructure.security.SesionTokenValidator;
import com.nicky.pruebatecnica.infrastructure.service.AutorizacionService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AutorizacionController {

    private final AutorizacionService service;
    private final AutorizacionWebMapper mapper;

    public AutorizacionController(AutorizacionService service, AutorizacionWebMapper mapper) {
        this.service = service;
        this.mapper = mapper;
    }

    @PostMapping("/autorizaciones")
    public ResponseEntity<AutorizacionResponse> registrar(
            @Valid @RequestBody AutorizacionRequest request,
            @AuthenticationPrincipal Jwt token) {

        var comando = new RegistrarAutorizacionComando(
                request.documentoAsegurado(),
                request.codigoServicio(),
                Integer.parseInt(request.cantidad()),
                sedeDe(token));

        var autorizacion = service.registrar(comando);
        DetalleLog.agregar(detalleRegistro(autorizacion));
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toResponse(autorizacion));
    }

    @GetMapping("/autorizaciones")
    public ListaAutorizacionesResponse listar(
            @RequestParam("fecha") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            @RequestParam(name = "pagina", defaultValue = "1") int pagina,
            @RequestParam(name = "tamano", defaultValue = "50") int tamano,
            @AuthenticationPrincipal Jwt token) {

        validarPaginacion(pagina, tamano);
        PaginaAutorizaciones resultado = service.consultarDelDia(sedeDe(token), fecha, pagina, tamano);
        DetalleLog.agregar(detalleConsulta(resultado));
        return mapper.toResponse(resultado, pagina, tamano);
    }

    /** Lo que se escribe en el log del POST: id, asegurado enmascarado y pagos. Nunca el documento completo. */
    private static String detalleRegistro(Autorizacion a) {
        return "id=" + a.idPublico() + " asegurado=" + a.aseguradoEnmascarado() + " servicio=" + a.servicio().codigo()
                + " cantidad=" + a.cantidad() + " pago_asegurado=" + a.liquidacion().pagoAsegurado()
                + " pago_aseguradora=" + a.liquidacion().pagoAseguradora();
    }

    /** Lo que se escribe en el log del GET: total, recaudo y primero/último id de la página, para diagnosticar paginación. */
    private static String detalleConsulta(PaginaAutorizaciones p) {
        List<Autorizacion> items = p.items();
        String primero = items.isEmpty() ? "-" : items.get(0).idPublico();
        String ultimo = items.isEmpty() ? "-" : items.get(items.size() - 1).idPublico();
        return "total=" + p.resumen().total() + " recaudo_esperado=" + p.resumen().recaudoEsperado()
                + " primero=" + primero + " ultimo=" + ultimo;
    }

    private static String sedeDe(Jwt token) {
        return token.getClaimAsString(SesionTokenValidator.CLAIM_SEDE);
    }

    private static void validarPaginacion(int pagina, int tamano) {
        List<ErrorCampo> errores = new ArrayList<>();
        if (pagina < 1) {
            errores.add(new ErrorCampo("pagina", "La página debe ser mayor o igual a 1"));
        }
        if (tamano < 1 || tamano > ListarAutorizacionesDelDiaUseCase.TAMANO_MAXIMO) {
            errores.add(new ErrorCampo("tamano",
                    "El tamaño debe estar entre 1 y " + ListarAutorizacionesDelDiaUseCase.TAMANO_MAXIMO));
        }
        if (!errores.isEmpty()) {
            throw new SolicitudInvalidaException(errores);
        }
    }
}
