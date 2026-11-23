package com.nicky.pruebatecnica.domain.service;

import com.nicky.pruebatecnica.domain.model.vo.Liquidacion;
import com.nicky.pruebatecnica.domain.model.vo.PlanSalud;

/**
 * Liquida cuánto paga el asegurado y cuánto la aseguradora. Aritmética entera en pesos, sin decimales.
 * Es una regla pura: no consulta nada, recibe lo ya acumulado en el año de póliza.
 */
public final class LiquidadorPago {

    private LiquidadorPago() {
    }

    /**
     * @param valor              valor del servicio (valor unitario por cantidad)
     * @param acumuladoAnioPoliza lo que el asegurado ya pagó en el año de póliza, por todos los canales
     */
    public static Liquidacion liquidar(PlanSalud plan, long valor, long acumuladoAnioPoliza) {
        // El deducible se paga primero: lo acumulado cuenta contra él hasta completarlo.
        long deduciblePendiente = plan.deducible() - Math.min(plan.deducible(), acumuladoAnioPoliza);
        long deducible = Math.min(valor, deduciblePendiente);

        // Coaseguro sobre lo que excede el deducible pendiente, al peso más cercano (mitad hacia arriba).
        long excedente = valor - deducible;
        long coaseguro = (excedente * plan.coaseguroPorcentaje() + 50) / 100;

        // Tope de desembolso: el pago no puede superar lo que falta para alcanzarlo.
        long restanteTope = Math.max(0, plan.topeDesembolso() - acumuladoAnioPoliza);
        long pago = Math.min(deducible + coaseguro, restanteTope);
        if (pago < deducible + coaseguro) {
            // El tope recorta primero el coaseguro y luego el deducible.
            coaseguro = Math.max(0, pago - deducible);
            deducible = Math.min(deducible, pago);
        }

        return new Liquidacion(valor, deducible, coaseguro, pago, valor - pago);
    }
}
