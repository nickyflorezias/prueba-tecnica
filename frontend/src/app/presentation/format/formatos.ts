const ZONA = 'America/Bogota';

const MONEDA = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const HORA = new Intl.DateTimeFormat('es-CO', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: ZONA,
});
const FECHA_HORA = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: ZONA,
});
const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long', timeZone: 'UTC' });

export function formatearPesos(valor: number): string {
  return MONEDA.format(valor);
}

export function formatearHora(iso: string): string {
  return HORA.format(new Date(iso));
}

export function formatearFechaHora(iso: string): string {
  return FECHA_HORA.format(new Date(iso));
}

export function formatearFecha(aaaaMmDd: string): string {
  return FECHA_LARGA.format(new Date(`${aaaaMmDd}T00:00:00Z`));
}