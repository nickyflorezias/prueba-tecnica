package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "asegurado")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AseguradoDbo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 10)
    private String documento;
    @Column(name = "fecha_ingreso", nullable = false)
    private LocalDate fechaIngreso;
    @Column(name = "anio_poliza_inicio", nullable = false)
    private LocalDate anioPolizaInicio;
    @Column(name = "pagos_otros_canales", nullable = false)
    private long pagosOtrosCanales;
}
