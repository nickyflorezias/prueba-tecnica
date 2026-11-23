package com.nicky.pruebatecnica.infrastructure.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Una línea por petición, con el formato de los registros de la v1:
 * {@code POST /api/v1/autorizaciones 201 dur=180ms usuario=... rol=... sede=... id=AU-000108 asegurado=XXXX6521 ...}.
 * Va antes de Spring Security para registrar también los 401 y 403. Nunca registra cuerpo, cabeceras ni token.
 */
@Component
@Order(-101) // Spring Security corre en -100
public class RegistroPeticionFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RegistroPeticionFilter.class);
    private static final String SESION_ANONIMA = "usuario=- rol=- sede=-";

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        long inicio = System.nanoTime();
        int estado = 500; // si la cadena lanza una excepción, la petición termina como error del servidor
        try {
            chain.doFilter(request, response);
            estado = response.getStatus();
        } finally {
            registrar(request, estado, (System.nanoTime() - inicio) / 1_000_000);
        }
    }

    private void registrar(HttpServletRequest request, int estado, long duracionMs) {
        String consulta = request.getQueryString();
        String destino = DetalleLog.limpiar(request.getRequestURI() + (consulta == null ? "" : "?" + consulta));
        String sesion = atributo(request, DetalleLog.ATTR_SESION, SESION_ANONIMA);
        String detalle = atributo(request, DetalleLog.ATTR_DETALLE, "");
        String complemento = detalle.isEmpty() ? "" : " " + detalle;

        if (estado >= 500) {
            log.error("{} {} {} dur={}ms {}{}", request.getMethod(), destino, estado, duracionMs, sesion, complemento);
        } else if (estado >= 400) {
            log.warn("{} {} {} dur={}ms {}{}", request.getMethod(), destino, estado, duracionMs, sesion, complemento);
        } else {
            log.info("{} {} {} dur={}ms {}{}", request.getMethod(), destino, estado, duracionMs, sesion, complemento);
        }
    }

    private static String atributo(HttpServletRequest request, String nombre, String porDefecto) {
        Object valor = request.getAttribute(nombre);
        return valor == null ? porDefecto : DetalleLog.limpiar(valor.toString());
    }
}
