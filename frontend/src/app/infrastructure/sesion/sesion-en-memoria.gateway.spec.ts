import { sesionDePrueba } from '../../../testing/dobles';
import { SesionEnMemoriaGateway } from './sesion-en-memoria.gateway';
import { leerClaims } from './emisor-token-http.gateway';

describe('SesionEnMemoriaGateway', () => {
  it('guarda solo en memoria, notifica y limpia sin tocar el almacenamiento del navegador', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const gateway = new SesionEnMemoriaGateway();
    const vistos: Array<string | undefined> = [];
    gateway.suscribir((s, motivo) => vistos.push(s?.token ?? motivo));
    gateway.establecer(sesionDePrueba({ token: 't1' }));
    expect(gateway.obtener()?.token).toBe('t1');
    gateway.limpiar('manual');
    expect(gateway.obtener()).toBeNull();
    expect(vistos).toEqual(['t1', 'manual']);
    expect(setItem).not.toHaveBeenCalled();
    expect(document.cookie).toBe('');
  });

  it('lee los claims de un JWT sin verificar la firma', () => {
    const carga = btoa(JSON.stringify({ sub: 'u', rol: 'AUXILIAR_CAJA', sede: 'IPS-0412', exp: 10 }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(leerClaims(`x.${carga}.y`)).toEqual({ sub: 'u', rol: 'AUXILIAR_CAJA', sede: 'IPS-0412', exp: 10 });
  });
});