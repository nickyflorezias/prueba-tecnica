package com.nicky.pruebatecnica.application.config;

import com.nicky.pruebatecnica.domain.model.Complejidad;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.LinkedHashMap;
import java.util.Map;

@ConfigurationProperties("sedes")
public class SedesProperties extends LinkedHashMap<String, SedesProperties.Sede> {

    public record Sede(Map<String, Servicio> tarifario) {
    }

    public record Servicio(String nombre, long valor, Complejidad complejidad) {
    }
}
