package com.nicky.pruebatecnica.infrastructure.logging;

import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * Datos de negocio que se agregan a la línea única de log de la petición (id, asegurado enmascarado, totales, motivo
 * de rechazo). Quien llama es responsable de no pasar datos personales: nunca el documento completo, el cuerpo ni el token.
 */
public final class DetalleLog {

    static final String ATTR_SESION = "log.sesion";
    static final String ATTR_DETALLE = "log.detalle";

    private DetalleLog() {
    }

    public static void agregar(String detalle) {
        RequestAttributes atributos = RequestContextHolder.getRequestAttributes();
        if (atributos == null) {
            return;
        }
        Object previo = atributos.getAttribute(ATTR_DETALLE, RequestAttributes.SCOPE_REQUEST);
        atributos.setAttribute(ATTR_DETALLE, previo == null ? detalle : previo + " " + detalle,
                RequestAttributes.SCOPE_REQUEST);
    }

    /** Evita inyección de líneas falsas en el log: sin saltos de línea ni tabulaciones y con largo acotado. */
    static String limpiar(String texto) {
        if (texto == null) {
            return "-";
        }
        String limpio = texto.replaceAll("[\\r\\n\\t]", "_");
        return limpio.length() > 300 ? limpio.substring(0, 300) + "..." : limpio;
    }
}
