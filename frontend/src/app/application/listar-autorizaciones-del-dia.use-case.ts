import { Autorizacion } from '../domain/model/autorizacion';
import { PaginaAutorizaciones } from '../domain/model/pagina-autorizaciones';
import { AutorizacionRepository } from '../domain/port/autorizacion-repository';

export const TAMANO_PAGINA = 50;

export class ListarAutorizacionesDelDiaUseCase {
  constructor(private readonly repositorio: AutorizacionRepository) {}

  async ejecutar(fecha: string, pagina: number): Promise<PaginaAutorizaciones> {
    const resultado = await this.repositorio.listarDelDia(fecha, pagina, TAMANO_PAGINA);
    return { ...resultado, items: sinRepetidos(resultado.items) };
  }
}

function sinRepetidos(items: readonly Autorizacion[]): readonly Autorizacion[] {
  const vistos = new Set<string>();
  return items.filter((a) => {
    if (vistos.has(a.id)) return false;
    vistos.add(a.id);
    return true;
  });
}