INSERT INTO asegurado (documento, fecha_ingreso, anio_poliza_inicio, pagos_otros_canales)
VALUES ('43876521',   '2019-03-01', '2026-03-01', 1700000),
       ('1036654782', '2026-09-10', '2026-09-10', 0),
       ('71234890',   '2015-11-20', '2025-11-20', 120000),
       ('32557019',   '2024-08-25', '2026-08-25', 0),
       ('1128450032', '2021-07-14', '2026-07-14', 1950000)
ON CONFLICT (documento) DO NOTHING;

-- Historial previo. Horas de Colombia (-05) guardadas como instante.
-- La división deducible/coaseguro de las dos primeras es un supuesto: el enunciado solo da el pago total.
INSERT INTO autorizacion (id, asegurado_id, asegurado_enmascarado, sede, codigo_servicio, nombre_servicio,
                          complejidad, valor_unitario, cantidad, valor, deducible, coaseguro, pago_asegurado,
                          pago_aseguradora, fecha_hora)
SELECT v.id, a.id, 'XXXX' || right(a.documento, 4), v.sede, v.cod, v.nombre, 'BAJA',
       v.unit, v.cant, v.unit * v.cant, v.ded, v.coa, v.ded + v.coa,
       v.unit * v.cant - (v.ded + v.coa), v.ts::timestamptz
FROM (VALUES (1, '43876521', 'IPS-0412', '890264', 'Consulta de medicina especializada', 112400, 1, 0,     16860, '2026-02-27 10:15:00-05'),
             (2, '71234890', 'IPS-0188', '890201', 'Consulta de medicina general',        58700, 1, 58700, 0,     '2025-11-19 21:30:00-05'),
             (3, '71234890', 'IPS-0412', '931000', 'Sesión de terapia física',            47938, 2, 95876, 0,     '2026-06-10 10:20:00-05')
     ) AS v (id, doc, sede, cod, nombre, unit, cant, ded, coa, ts)
JOIN asegurado a ON a.documento = v.doc
ON CONFLICT (id) DO NOTHING;
