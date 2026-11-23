package com.nicky.pruebatecnica.application.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("plan")
public record PlanProperties(long deducible, int coaseguroPorcentaje, long topeDesembolso, int carenciaDias) {
}
