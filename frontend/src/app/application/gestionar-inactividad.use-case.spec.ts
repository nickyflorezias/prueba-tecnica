import { ActividadFalsa, RelojFalso } from '../../testing/dobles';
import { GestionarInactividadUseCase } from './gestionar-inactividad.use-case';

describe('GestionarInactividadUseCase (timers falsos, sin DOM)', () => {
  let actividad: ActividadFalsa;
  let caso: GestionarInactividadUseCase;
  let eventos: string[];

  beforeEach(() => {
    vi.useFakeTimers();
    actividad = new ActividadFalsa();
    caso = new GestionarInactividadUseCase(new RelojFalso(), actividad);
    eventos = [];
    caso.iniciar({
      alAvisar: () => eventos.push('aviso'),
      alExpirar: () => eventos.push('cierre'),
      alActividad: () => eventos.push('actividad'),
    });
  });

  afterEach(() => vi.useRealTimers());

  it('avisa a los 150 s y cierra a los 180 s', () => {
    vi.advanceTimersByTime(149_999);
    expect(eventos).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(eventos).toEqual(['aviso']);
    vi.advanceTimersByTime(29_999);
    expect(eventos).toEqual(['aviso']);
    vi.advanceTimersByTime(1);
    expect(eventos).toEqual(['aviso', 'cierre']);
    expect(actividad.escuchando).toBe(false);
  });

  it('la actividad antes del aviso reinicia la cuenta', () => {
    vi.advanceTimersByTime(100_000);
    actividad.simular();
    vi.advanceTimersByTime(149_999);
    expect(eventos).toEqual(['actividad']);
    vi.advanceTimersByTime(1);
    expect(eventos).toEqual(['actividad', 'aviso']);
  });

  it('la actividad durante el aviso no lo descarta; continuar reinicia', () => {
    vi.advanceTimersByTime(150_000);
    actividad.simular();
    vi.advanceTimersByTime(30_000);
    expect(eventos).toEqual(['aviso', 'cierre']);
  });

  it('continuar durante el aviso evita el cierre', () => {
    vi.advanceTimersByTime(160_000);
    caso.continuar();
    vi.advanceTimersByTime(100_000);
    expect(eventos).toEqual(['aviso']);
    vi.advanceTimersByTime(50_000);
    expect(eventos).toEqual(['aviso', 'aviso']);
  });

  it('detener cancela todo', () => {
    caso.detener();
    vi.advanceTimersByTime(300_000);
    expect(eventos).toEqual([]);
    expect(actividad.escuchando).toBe(false);
  });
});