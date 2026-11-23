import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function validadorDeDominio(regla: (valor: string) => string | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const mensaje = regla(String(control.value ?? ''));
    return mensaje ? { dominio: mensaje } : null;
  };
}

export function mensajeDeError(control: AbstractControl): string | null {
  const errores = control.errors;
  if (!errores) return null;
  const mensaje = errores['dominio'] ?? errores['servidor'];
  return typeof mensaje === 'string' ? mensaje : null;
}