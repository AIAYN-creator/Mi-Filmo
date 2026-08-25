/**
 * Capa de acceso a la API de GitHub. No toca el DOM ni conoce la interfaz.
 *
 * Las operaciones nunca lanzan por fallos esperables: devuelven
 * `{ ok: true, ... }` o `{ ok: false, reason, ... }` para que quien llama
 * decida qué mensaje mostrar.
 */

import { DATA_FILE, DEFAULT_BRANCH } from './config.js';

const API_ROOT = 'https://api.github.com';
const API_VERSION = '2022-11-28';

/** btoa() solo acepta latin1: hay que pasar por UTF-8 o se rompen tildes y ñ. */
export function utf8ToBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function base64ToUtf8(b64) {
  // GitHub devuelve el base64 partido en líneas; atob las tolera, pero mejor no depender de ello.
  const binary = atob(String(b64).replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Acepta "usuario/repo", la URL completa o la URL .git y devuelve siempre "usuario/repo". */
export function normalizeRepo(value) {
  return String(value || '')
    .trim()
    .replace(/^https?:\/\/github\.com\//i, '')
    .replace(/\.git$/i, '')
    .replace(/^\/+|\/+$/g, '');
}

export function isValidRepo(value) {
  return /^[\w.-]+\/[\w.-]+$/.test(value);
}

async function errorMessage(res) {
  try {
    const body = await res.json();
    return body?.message || '';
  } catch {
    return '';
  }
}

/**
 * Cliente del catálogo alojado en un repositorio.
 *
 * Guarda el `sha` del último `peliculas.json` conocido y lo envía en cada
 * escritura: así GitHub rechaza el guardado si otro dispositivo escribió
 * antes que nosotros, en lugar de perder sus cambios silenciosamente.
 */
export class CatalogRepo {
  #sha = null;

  constructor({ repo = '', token = '', branch = DEFAULT_BRANCH } = {}) {
    this.repo = normalizeRepo(repo);
    this.token = String(token || '').trim();
    this.branch = String(branch || '').trim() || DEFAULT_BRANCH;
  }

  /** Hay repositorio: se puede leer. */
  get configured() {
    return Boolean(this.repo);
  }

  /** Hay repositorio y token: se puede escribir. */
  get writable() {
    return Boolean(this.repo && this.token);
  }

  get contentsUrl() {
    return `${API_ROOT}/repos/${this.repo}/contents/${DATA_FILE}`;
  }

  #headers(extra = {}) {
    const headers = {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': API_VERSION,
      ...extra
    };
    if (this.token) headers.Authorization = `Bearer ${this.token}`;
    return headers;
  }

  /**
   * Lee el catálogo y memoriza su sha.
   * @returns {Promise<{ok: true, empty: boolean, items: Array}|{ok: false, reason: string}>}
   */
  async read() {
    const url = `${this.contentsUrl}?ref=${encodeURIComponent(this.branch)}`;
    let res;
    try {
      res = await fetch(url, { headers: this.#headers(), cache: 'no-store' });
    } catch {
      return { ok: false, reason: 'network' };
    }

    if (res.status === 404) {
      // GitHub responde 404 tanto si falta el archivo como si el repositorio no
      // es visible con estas credenciales. Sin distinguirlo, un token sin permisos
      // parecería un catálogo vacío y el usuario creería haber perdido sus obras.
      let repoRes;
      try {
        repoRes = await fetch(`${API_ROOT}/repos/${this.repo}`, { headers: this.#headers() });
      } catch {
        return { ok: false, reason: 'network' };
      }
      if (!repoRes.ok) return { ok: false, reason: 'norepo', status: repoRes.status };

      this.#sha = null;
      return { ok: true, empty: true, items: [] };
    }

    if (!res.ok) {
      return { ok: false, reason: 'http', status: res.status, message: await errorMessage(res) };
    }

    let data;
    try {
      data = await res.json();
    } catch {
      return { ok: false, reason: 'parse' };
    }

    // Por encima de 1 MB la API omite el contenido y exige la Blobs API.
    if (data.encoding !== 'base64' || typeof data.content !== 'string') {
      return { ok: false, reason: 'toobig' };
    }

    let items;
    try {
      items = JSON.parse(base64ToUtf8(data.content));
    } catch {
      return { ok: false, reason: 'parse' };
    }
    if (!Array.isArray(items)) return { ok: false, reason: 'parse' };

    this.#sha = data.sha;
    return { ok: true, empty: false, items };
  }

  /**
   * Sobrescribe el catálogo completo con un commit.
   * @returns {Promise<{ok: true}|{ok: false, reason: string}>}
   */
  async write(items, message) {
    if (!this.writable) return { ok: false, reason: 'unconfigured' };

    const body = {
      message: `Mi Filmo: ${message}`,
      content: utf8ToBase64(`${JSON.stringify(items, null, 2)}\n`),
      branch: this.branch
    };
    // Sin sha, GitHub interpreta la petición como "crear archivo nuevo".
    if (this.#sha) body.sha = this.#sha;

    let res;
    try {
      res = await fetch(this.contentsUrl, {
        method: 'PUT',
        headers: this.#headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body)
      });
    } catch {
      return { ok: false, reason: 'network' };
    }

    // 409: el sha que enviamos ya no es el último.
    // 422: no enviamos sha pero el archivo ya existe.
    // Para la app significan lo mismo: alguien escribió antes, hay que recargar.
    if (res.status === 409 || res.status === 422) return { ok: false, reason: 'conflict' };

    if (!res.ok) {
      return { ok: false, reason: 'http', status: res.status, message: await errorMessage(res) };
    }

    let data = null;
    try {
      data = await res.json();
    } catch {
      /* el sha se recuperará en la próxima lectura */
    }
    this.#sha = data?.content?.sha ?? null;
    return { ok: true };
  }
}
