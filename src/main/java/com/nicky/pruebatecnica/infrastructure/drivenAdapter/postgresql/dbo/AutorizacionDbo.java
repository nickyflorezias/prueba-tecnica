package com.nicky.pruebatecnica.infrastructure.drivenAdapter.postgresql.dbo;

import com.nicky.pruebatecnica.domain.model.Complejidad;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.time.Instant;

@Entity
@Immutable
@Table(name = "autorizacion")
@Getter
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AutorizacionDbo {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "aut_seq")
    @SequenceGenerator(name = "aut_seq", sequenceName = "autorizacion_seq", allocationSize = 1)
    private Long id;

    @Column(name = "asegurado_id", nullable = false)
    private Long aseguradoId;
    @Column(name = "asegurado_enmascarado", nullable = false, length = 12)
    private String aseguradoEnmascarado;

    @Column(nullable = false, length = 10)
    private String sede;
    @Column(name = "codigo_servicio", nullable = false, length = 10)
    private String codigoServicio;
    @Column(name = "nombre_servicio", nullable = false)
    private String nombreServicio;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Complejidad complejidad;
    @Column(name = "valor_unitario", nullable = false)
    private long valorUnitario;
    @Column(nullable = false)
    private int cantidad;
    @Column(nullable = false)
    private long valor;
    @Column(nullable = false)
    private long deducible;
    @Column(nullable = false)
    private long coaseguro;
    @Column(name = "pago_asegurado", nullable = false)
    private long pagoAsegurado;
    @Column(name = "pago_aseguradora", nullable = false)
    private long pagoAseguradora;
    @Column(name = "fecha_hora", nullable = false)
    private Instant fechaHora;
}
