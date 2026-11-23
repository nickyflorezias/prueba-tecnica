package com.nicky.pruebatecnica.domain.usecase.autorizacion;

import java.time.LocalDate;

import com.nicky.pruebatecnica.domain.model.vo.RangoDia;
import com.nicky.pruebatecnica.domain.model.vo.ResumenDia;
import com.nicky.pruebatecnica.domain.model.gateway.AutorizacionRepository;

public class ResumenDelDiaUseCase {

    private final AutorizacionRepository autorizacionRepository;

    public ResumenDelDiaUseCase(AutorizacionRepository autorizacionRepository) {
        this.autorizacionRepository = autorizacionRepository;
    }

    public ResumenDia execute(String sede, LocalDate fecha) {
        if (sede == null || sede.isBlank()) {
            throw new IllegalArgumentException("La sede es obligatoria");
        }
        RangoDia dia = RangoDia.de(fecha);
        return this.autorizacionRepository.resumenDelDia(sede, dia.desde(), dia.hasta());
    }
}
