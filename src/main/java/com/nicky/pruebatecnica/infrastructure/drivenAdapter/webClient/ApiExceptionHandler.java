package com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient;

import com.nicky.pruebatecnica.domain.model.exception.AseguradoNoEncontradoException;
import com.nicky.pruebatecnica.domain.model.exception.EnCarenciaException;
import com.nicky.pruebatecnica.domain.model.exception.ServicioNoEnTarifarioException;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ErrorNegocioResponse;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ErroresResponse;
import com.nicky.pruebatecnica.infrastructure.drivenAdapter.webClient.dto.ErroresResponse.ErrorCampo;
import com.nicky.pruebatecnica.infrastructure.logging.DetalleLog;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Traduce los errores al contrato: 400 con la lista de campos, 404 y 409 con código.
 * Los mensajes nunca incluyen el documento del asegurado.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ErroresResponse> cuerpoInvalido(MethodArgumentNotValidException ex) {
        List<ErrorCampo> errores = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> new ErrorCampo(aSnakeCase(e.getField()), e.getDefaultMessage()))
                .toList();
        return bad(errores);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ErroresResponse> cuerpoIlegible(HttpMessageNotReadableException ex) {
        return bad(List.of(new ErrorCampo("cuerpo", "El cuerpo debe ser un JSON válido con los campos esperados")));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ErroresResponse> parametroFaltante(MissingServletRequestParameterException ex) {
        return bad(List.of(new ErrorCampo(ex.getParameterName(), "Es obligatorio")));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ErroresResponse> parametroConFormatoInvalido(MethodArgumentTypeMismatchException ex) {
        String mensaje = "fecha".equals(ex.getName())
                ? "Use el formato AAAA-MM-DD"
                : "Debe ser un número entero";
        return bad(List.of(new ErrorCampo(ex.getName(), mensaje)));
    }

    @ExceptionHandler(SolicitudInvalidaException.class)
    ResponseEntity<ErroresResponse> solicitudInvalida(SolicitudInvalidaException ex) {
        return bad(ex.getErrores());
    }

    @ExceptionHandler(ServicioNoEnTarifarioException.class)
    ResponseEntity<ErroresResponse> servicioNoEnTarifario(ServicioNoEnTarifarioException ex) {
        return bad(List.of(new ErrorCampo("codigo_servicio", ex.getMessage())));
    }

    @ExceptionHandler(AseguradoNoEncontradoException.class)
    ResponseEntity<ErrorNegocioResponse> aseguradoNoEncontrado(AseguradoNoEncontradoException ex) {
        DetalleLog.agregar("motivo=ASEGURADO_NO_ENCONTRADO");
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorNegocioResponse("ASEGURADO_NO_ENCONTRADO", ex.getMessage(), null));
    }

    @ExceptionHandler(EnCarenciaException.class)
    ResponseEntity<ErrorNegocioResponse> enCarencia(EnCarenciaException ex) {
        DetalleLog.agregar("motivo=EN_CARENCIA disponible_desde=" + ex.getDisponibleDesde());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorNegocioResponse("EN_CARENCIA", ex.getMessage(),
                        DateTimeFormatter.ISO_LOCAL_DATE.format(ex.getDisponibleDesde())));
    }

    private static ResponseEntity<ErroresResponse> bad(List<ErrorCampo> errores) {
        DetalleLog.agregar("motivo=SOLICITUD_INVALIDA campos=" + errores.stream().map(ErrorCampo::campo).distinct().toList());
        return ResponseEntity.badRequest().body(new ErroresResponse(errores));
    }

    private static String aSnakeCase(String campo) {
        return campo.replaceAll("([a-z0-9])([A-Z])", "$1_$2").toLowerCase();
    }
}
