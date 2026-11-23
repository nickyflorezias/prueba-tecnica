package com.nicky.pruebatecnica.infrastructure.logging;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.boot.info.BuildProperties;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.time.ZoneId;

/** Línea de arranque como en la v1: {@code INICIO version=... zona_horaria_servidor=... pool_bd=...}. */
@Component
public class InicioAplicacionListener {

    private static final Logger log = LoggerFactory.getLogger(InicioAplicacionListener.class);

    private final ObjectProvider<BuildProperties> build;
    private final ObjectProvider<DataSource> dataSource;

    public InicioAplicacionListener(ObjectProvider<BuildProperties> build, ObjectProvider<DataSource> dataSource) {
        this.build = build;
        this.dataSource = dataSource;
    }

    @EventListener(ApplicationReadyEvent.class)
    void alIniciar() {
        BuildProperties propiedades = build.getIfAvailable();
        String version = propiedades == null ? "dev" : propiedades.getVersion();
        DataSource ds = dataSource.getIfAvailable();
        String pool = ds instanceof HikariDataSource h ? String.valueOf(h.getMaximumPoolSize()) : "-";
        log.info("INICIO version={} zona_horaria_servidor={} pool_bd={}", version, ZoneId.systemDefault(), pool);
    }
}
