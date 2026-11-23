package com.nicky.pruebatecnica.infrastructure.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.Set;

public class SesionTokenValidator implements OAuth2TokenValidator<Jwt> {

    public static final String CLAIM_ROL = "rol";
    public static final String CLAIM_SEDE = "sede";
    public static final String ROL_ADMISION = "AUXILIAR_ADMISION";
    public static final String ROL_CAJA = "AUXILIAR_CAJA";

    private static final Set<String> ROLES = Set.of(ROL_ADMISION, ROL_CAJA);

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getExpiresAt() == null) {
            return falla("El token debe tener expiración");
        }
        if (isBlank(jwt.getSubject())) {
            return falla("El token no identifica al usuario");
        }
        String rol = jwt.getClaimAsString(CLAIM_ROL);
        if (rol == null || !ROLES.contains(rol)) {
            return falla("El token no trae un rol válido");
        }
        if (isBlank(jwt.getClaimAsString(CLAIM_SEDE))) {
            return falla("El token no trae la sede");
        }
        return OAuth2TokenValidatorResult.success();
    }

    private static boolean isBlank(String valor) {
        return valor == null || valor.isBlank();
    }

    private static OAuth2TokenValidatorResult falla(String descripcion) {
        return OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token", descripcion, null));
    }
}
