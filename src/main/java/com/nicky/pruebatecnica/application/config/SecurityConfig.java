package com.nicky.pruebatecnica.application.config;

import com.nicky.pruebatecnica.infrastructure.logging.ContextoSesionFilter;
import com.nicky.pruebatecnica.infrastructure.security.SesionTokenValidator;
import jakarta.servlet.DispatcherType;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final String RECURSO = "/api/v1/autorizaciones";
    private static final int LONGITUD_MINIMA_SECRETO = 32;

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtDecoder jwtDecoder) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Sin esto, un error interno (500) se reenvía a /error, cae en denyAll y se ve como 403.
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.POST, RECURSO).hasRole(SesionTokenValidator.ROL_ADMISION)
                        .requestMatchers(HttpMethod.GET, RECURSO)
                        .hasAnyRole(SesionTokenValidator.ROL_ADMISION, SesionTokenValidator.ROL_CAJA)
                        .anyRequest().denyAll())
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.decoder(jwtDecoder).jwtAuthenticationConverter(convertidor())))
                // Deja usuario, rol y sede en la petición para la línea de log (el token ya está validado).
                .addFilterAfter(new ContextoSesionFilter(), BearerTokenAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    JwtDecoder jwtDecoder(@Value("${security.jwt.secret}") String secreto) {
        if (secreto == null || secreto.getBytes(StandardCharsets.UTF_8).length < LONGITUD_MINIMA_SECRETO) {
            throw new IllegalStateException(
                    "JWT_SECRET debe tener al menos " + LONGITUD_MINIMA_SECRETO + " caracteres");
        }
        var clave = new SecretKeySpec(secreto.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(clave).macAlgorithm(MacAlgorithm.HS256).build();
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefault(), new SesionTokenValidator()));
        return decoder;
    }

    private JwtAuthenticationConverter convertidor() {
        var convertidor = new JwtAuthenticationConverter();
        convertidor.setJwtGrantedAuthoritiesConverter(jwt ->
                List.of(new SimpleGrantedAuthority("ROLE_" + jwt.getClaimAsString(SesionTokenValidator.CLAIM_ROL))));
        return convertidor;
    }
}
