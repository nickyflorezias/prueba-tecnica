import { createServer } from 'node:http';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HOST = '127.0.0.1';
const PUERTO = Number(process.env.TOKEN_SERVER_PORT ?? 4401);
const VIGENCIA_SEGUNDOS = 180;
const LIMITE_CUERPO = 1024;

const PERFILES = {
  'admision-0412': { sub: 'aux.admision.0412', rol: 'AUXILIAR_ADMISION', sede: 'IPS-0412' },
  'caja-0412': { sub: 'aux.caja.0412', rol: 'AUXILIAR_CAJA', sede: 'IPS-0412' },
  'admision-0188': { sub: 'aux.admision.0188', rol: 'AUXILIAR_ADMISION', sede: 'IPS-0188' },
};

function leerSecreto() {
  const aqui = dirname(fileURLToPath(import.meta.url));
  const texto = readFileSync(resolve(aqui, '..', '..', '.env'), 'utf8');
  for (const linea of texto.split(/\r?\n/)) {
    const m = /^\s*JWT_SECRET\s*=\s*(.*?)\s*$/.exec(linea);
    if (m) return m[1].replace(/^(['"])(.*)\1$/, '$2');
  }
  throw new Error('JWT_SECRET no está definido en ../.env');
}

const secreto = leerSecreto();

function base64url(valor) {
  return Buffer.from(valor).toString('base64url');
}

function firmar(claims) {
  const cabecera = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const cuerpo = base64url(JSON.stringify(claims));
  const firma = createHmac('sha256', secreto).update(`${cabecera}.${cuerpo}`).digest('base64url');
  return `${cabecera}.${cuerpo}.${firma}`;
}

function responder(res, estado, cuerpo) {
  res.writeHead(estado, {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(cuerpo));
}

function hostPermitido(host = '') {
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}

const servidor = createServer((req, res) => {
  if (!hostPermitido(req.headers.host)) return responder(res, 403, { mensaje: 'Host no permitido' });
  if (req.method !== 'POST' || req.url !== '/dev/token') return responder(res, 404, { mensaje: 'No encontrado' });

  let cuerpo = '';
  let excedido = false;
  req.on('data', (trozo) => {
    cuerpo += trozo;
    if (cuerpo.length > LIMITE_CUERPO) {
      excedido = true;
      req.destroy();
    }
  });
  req.on('end', () => {
    if (excedido) return;
    let perfil;
    try {
      perfil = JSON.parse(cuerpo).perfil;
    } catch {
      return responder(res, 400, { mensaje: 'JSON inválido' });
    }
    const datos = Object.hasOwn(PERFILES, perfil) ? PERFILES[perfil] : null;
    if (!datos) return responder(res, 400, { mensaje: 'Perfil desconocido' });
    const exp = Math.floor(Date.now() / 1000) + VIGENCIA_SEGUNDOS;
    responder(res, 200, { token: firmar({ ...datos, exp }) });
  });
});

servidor.listen(PUERTO, HOST, () => {
  console.log(`Servidor de tokens de desarrollo en http://${HOST}:${PUERTO}`);
});
