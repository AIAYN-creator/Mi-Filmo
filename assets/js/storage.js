/**
 * Persistencia en el navegador: ajustes de conexión y copia local del catálogo.
 *
 * Todo pasa por wrappers con try/catch porque localStorage lanza excepciones
 * en modo privado de Safari y cuando la cuota está llena.
 */

import { STORAGE_KEYS, DEFAULT_BRANCH } from './config.js';

function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* nada que hacer: el ajuste simplemente no persiste */
  }
}

/** Devuelve la configuración de conexión guardada en este navegador. */
export function loadSettings() {
  return {
    repo: safeGet(STORAGE_KEYS.repo) || '',
    token: safeGet(STORAGE_KEYS.token) || '',
    branch: safeGet(STORAGE_KEYS.branch) || DEFAULT_BRANCH
  };
}

/** Guarda la configuración. Un valor vacío borra la clave en lugar de guardar "". */
export function saveSettings({ repo, token, branch }) {
  if (repo) safeSet(STORAGE_KEYS.repo, repo);
  else safeRemove(STORAGE_KEYS.repo);

  if (token) safeSet(STORAGE_KEYS.token, token);
  else safeRemove(STORAGE_KEYS.token);

  if (branch && branch !== DEFAULT_BRANCH) safeSet(STORAGE_KEYS.branch, branch);
  else safeRemove(STORAGE_KEYS.branch);
}

/**
 * Lee la copia local del catálogo.
 * Devuelve null si no hay copia o si pertenece a otro repositorio, para que
 * cambiar de repo nunca muestre las obras del anterior.
 */
export function readCache(repo, branch) {
  const raw = safeGet(STORAGE_KEYS.cache);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    // La rama forma parte de la identidad del catálogo: dos ramas del mismo
    // repositorio tienen contenidos distintos y no pueden compartir copia.
    if (!parsed || parsed.repo !== repo || parsed.branch !== branch) return null;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Guarda una copia local del catálogo, fechada, para poder abrir la app sin red. */
export function writeCache(repo, branch, items) {
  safeSet(STORAGE_KEYS.cache, JSON.stringify({ repo, branch, items, savedAt: Date.now() }));
}

export function clearCache() {
  safeRemove(STORAGE_KEYS.cache);
}
