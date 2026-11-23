package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import java.time.LocalDate;
import java.util.List;

import com.nicky.pruebatecnica.domain.model.Autorizacion;
import com.nicky.pruebatecnica.domain.model.vo.RangoDia;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;

public class ListarAutorizacionesDelDiaUseCase {

    public static final int TAMANO_MAXIMO = 50;

    private final AutorizacionRepository autorizacionRepository;

    public ListarAutorizacionesDelDiaUseCase(AutorizacionRepository autorizacionRepository) {
        this.autorizacionRepository = autorizacionRepository;
    }

    public List<Autorizacion> execute(String sede, LocalDate fecha, int pagina, int tamano) {
        if (sede == null || sede.isBlank()) {
            throw new IllegalArgumentException("La sede es obligatoria");
        }
        if (pagina < 1) {
            throw new IllegalArgumentException("pagina debe ser mayor o igual a 1");
        }
        if (tamano < 1 || tamano > TAMANO_MAXIMO) {
            throw new IllegalArgumentException("tamano debe estar entre 1 y " + TAMANO_MAXIMO);
        }
        RangoDia dia = RangoDia.de(fecha);
        return this.autorizacionRepository.listarDelDia(sede, dia.desde(), dia.hasta(), pagina, tamano);
    }
}
