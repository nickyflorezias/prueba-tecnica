import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ErrorDeRedError, ErrorInesperadoError } from '../../domain/error/errores-dominio';
import { Rol } from '../../domain/model/rol';
import { PerfilSesion, Sesion } from '../../domain/model/sesion';
import { EmisorTokenGateway } from '../../domain/port/emisor-token-gateway';

interface ClaimsToken {
  sub: string;
  rol: Rol;
  sede: string;
  exp: number;
}

export class EmisorTokenHttpGateway implements EmisorTokenGateway {
  constructor(private readonly http: HttpClient) {}

  async emitir(perfil: PerfilSesion): Promise<Sesion> {
    let token: string;
    try {
      const respuesta = await firstValueFrom(this.http.post<{ token: string }>('/dev/token', { perfil }));
      token = respuesta.token;
    } catch (error) {
      throw (error as { status?: number }).status === 0 ? new ErrorDeRedError() : new ErrorInesperadoError();
    }
    const claims = leerClaims(token);
    return { perfil, usuario: claims.sub, rol: claims.rol, sede: claims.sede, expiraEn: claims.exp * 1000, token };
  }
}

export function leerClaims(token: string): ClaimsToken {
  const carga = token.split('.')[1];
  if (!carga) throw new ErrorInesperadoError();
  const binario = atob(carga.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as ClaimsToken;
}