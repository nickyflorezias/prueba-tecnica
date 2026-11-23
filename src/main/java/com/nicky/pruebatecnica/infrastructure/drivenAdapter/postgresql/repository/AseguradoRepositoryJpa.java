package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.repository;

import com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo.AseguradoDbo;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AseguradoRepositoryJpa extends JpaRepository<AseguradoDbo, Long> {

    Optional<AseguradoDbo> findByDocumento(String documento);

    /**
     * SELECT ... FOR UPDATE sobre la fila del asegurado. Debe ejecutarse dentro de una transacción
     * que abarque todo el registro de la autorización: el bloqueo se libera al terminar esa transacción.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select a from AseguradoDbo a where a.documento = :documento")
    Optional<AseguradoDbo> findByDocumentoForUpdate(@Param("documento") String documento);
}
