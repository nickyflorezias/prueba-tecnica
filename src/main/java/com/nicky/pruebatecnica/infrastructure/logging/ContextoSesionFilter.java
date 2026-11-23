package com.nicky.pruebatecnica.infrastructure.logging;

import com.nicky.pruebatecnica.infrastructure.security.SesionTokenValidator;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Deja en la petición quién es el usuario (sub, rol y sede del token ya validado) para la línea de log.
 * No es un @Component: se registra solo dentro de la cadena de seguridad, después de validar el token.
 */
public class ContextoSesionFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication autenticacion = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacion != null && autenticacion.getPrincipal() instanceof Jwt jwt) {
            request.setAttribute(DetalleLog.ATTR_SESION, "usuario=" + jwt.getSubject()
                    + " rol=" + jwt.getClaimAsString(SesionTokenValidator.CLAIM_ROL)
                    + " sede=" + jwt.getClaimAsString(SesionTokenValidator.CLAIM_SEDE));
        }
        chain.doFilter(request, response);
    }
}
