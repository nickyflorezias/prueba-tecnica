CREATE TABLE IF NOT EXISTS asegurado (
    id                  BIGSERIAL   PRIMARY KEY,
    documento           VARCHAR(10) NOT NULL UNIQUE,
    fecha_ingreso       DATE        NOT NULL,
    anio_poliza_inicio  DATE        NOT NULL,
    pagos_otros_canales BIGINT      NOT NULL DEFAULT 0 CHECK (pagos_otros_canales >= 0)
);

-- Empieza en 100: los ids 1 a 3 quedan reservados al seed de prueba.
CREATE SEQUENCE IF NOT EXISTS autorizacion_seq START 100 INCREMENT 1;

CREATE TABLE IF NOT EXISTS autorizacion (
    id               BIGINT       PRIMARY KEY DEFAULT nextval('autorizacion_seq'),
    asegurado_id     BIGINT       NOT NULL REFERENCES asegurado (id),
    asegurado_enmascarado VARCHAR(12) NOT NULL,
    sede             VARCHAR(10)  NOT NULL,
    codigo_servicio  VARCHAR(10)  NOT NULL,
    nombre_servicio  VARCHAR(100) NOT NULL,
    complejidad      VARCHAR(5)   NOT NULL CHECK (complejidad IN ('BAJA', 'ALTA')),
    valor_unitario   BIGINT       NOT NULL,
    cantidad         INT          NOT NULL CHECK (cantidad BETWEEN 1 AND 10),
    valor            BIGINT       NOT NULL,
    deducible        BIGINT       NOT NULL,
    coaseguro        BIGINT       NOT NULL,
    pago_asegurado   BIGINT       NOT NULL,
    pago_aseguradora BIGINT       NOT NULL,
    fecha_hora       TIMESTAMPTZ  NOT NULL,
    CHECK (pago_asegurado = deducible + coaseguro),
    CHECK (valor = pago_asegurado + pago_aseguradora)
);

CREATE INDEX IF NOT EXISTS ix_aut_sede_fecha ON autorizacion (sede, fecha_hora, id);
CREATE INDEX IF NOT EXISTS ix_aut_asegurado  ON autorizacion (asegurado_id, fecha_hora);
