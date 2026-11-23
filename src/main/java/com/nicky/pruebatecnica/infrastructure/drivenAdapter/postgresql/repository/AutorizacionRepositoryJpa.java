package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.repository;

import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo.AutorizacionDbo;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AutorizacionRepositoryJpa extends JpaRepository<AutorizacionDbo, Long> {

    @Query("""
            select coalesce(sum(a.pagoAsegurado), 0L)
            from AutorizacionDbo a
            where a.aseguradoId = :aseguradoId
              and a.fechaHora >= :desde and a.fechaHora < :hasta
            """)
    long sumarPagosAsegurado(@Param("aseguradoId") Long aseguradoId,
                             @Param("desde") Instant desde,
                             @Param("hasta") Instant hasta);

    @Query("""
            select coalesce(sum(a.cantidad), 0L)
            from AutorizacionDbo a
            where a.aseguradoId = :aseguradoId
              and a.codigoServicio = :codigoServicio
              and a.fechaHora >= :desde and a.fechaHora < :hasta
            """)
    long contarSesiones(@Param("aseguradoId") Long aseguradoId,
                        @Param("codigoServicio") String codigoServicio,
                        @Param("desde") Instant desde,
                        @Param("hasta") Instant hasta);

    @Query("""
            select a from AutorizacionDbo a
            where a.sede = :sede
              and a.fechaHora >= :desde and a.fechaHora < :hasta
            order by a.fechaHora asc, a.id asc
            """)
    List<AutorizacionDbo> listarDelDia(@Param("sede") String sede,
                                       @Param("desde") Instant desde,
                                       @Param("hasta") Instant hasta,
                                       Pageable pageable);

    @Query("""
            select count(a) as total,
                   coalesce(sum(a.valor), 0L) as valorTotal,
                   coalesce(sum(a.pagoAsegurado), 0L) as recaudoEsperado
            from AutorizacionDbo a
            where a.sede = :sede
              and a.fechaHora >= :desde and a.fechaHora < :hasta
            """)
    ResumenProyeccion resumenDelDia(@Param("sede") String sede,
                                    @Param("desde") Instant desde,
                                    @Param("hasta") Instant hasta);

    interface ResumenProyeccion {
        long getTotal();

        long getValorTotal();

        long getRecaudoEsperado();
    }
}
