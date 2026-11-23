import { Rol } from './rol';

export type PerfilSesion = 'admision-0412' | 'caja-0412' | 'admision-0188';

export type MotivoCierre = 'manual' | 'inactividad' | 'no-autorizada';

export interface Sesion {
  readonly perfil: PerfilSesion;
  readonly usuario: string;
  readonly rol: Rol;
  readonly sede: string;
  readonly expiraEn: number;
  readonly token: string;
}