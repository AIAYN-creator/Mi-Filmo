/**
 * Modelo de datos: normalización, filtrado y orden.
 * Funciones puras, sin DOM ni red, para poder razonarlas (y testearlas) sueltas.
 */

import { TIPOS } from './config.js';

const TIPOS_VALIDOS = new Set(TIPOS);

/**
 * Genera un id único.
 * `crypto.randomUUID` exige contexto seguro, así que no existe al servir la app
 * por http en una IP de la red local (un caso real: probarla desde el móvil).
 */
export function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `obra-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Devuelve un item con todos los campos presentes y del tipo correcto.
 * El JSON se edita a mano en GitHub, así que cualquier registro puede llegar
 * incompleto: normalizar aquí evita que un campo ausente rompa el render entero.
 */
export function normalizeItem(raw) {
  const item = raw && typeof raw === 'object' ? raw : {};
  const valoracion = Number(item.valoracion);

  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(),
    titulo: String(item.titulo ?? '').trim() || 'Sin título',
    director: String(item.director ?? '').trim(),
    tipo: TIPOS_VALIDOS.has(item.tipo) ? item.tipo : 'Otro',
    valoracion: Number.isFinite(valoracion) ? Math.min(5, Math.max(0, valoracion)) : 0,
    etiquetas: Array.isArray(item.etiquetas)
      ? item.etiquetas.map((t) => String(t).trim()).filter(Boolean)
      : [],
    review: String(item.review ?? ''),
    fechaVisionado: typeof item.fechaVisionado === 'string' ? item.fechaVisionado : ''
  };
}

export function normalizeCatalog(raw) {
  return Array.isArray(raw) ? raw.map(normalizeItem) : [];
}

/**
 * Chips de valoración.
 * 'Todas' no filtra; '0' busca el cero exacto (las obras "para el olvido");
 * el resto son mínimos, que es como se consulta un diario de cine en la
 * práctica: "enséñame todo lo que puntué 4 o más".
 */
export const RATING_FILTERS = [
  { value: 'Todas', label: 'Todas' },
  { value: '0', label: '0★' },
  { value: '1', label: '1★+' },
  { value: '2', label: '2★+' },
  { value: '3', label: '3★+' },
  { value: '4', label: '4★+' },
  { value: '5', label: '5★' }
];

export function createFilterState() {
  return { search: '', tipo: 'Todas', rating: 'Todas' };
}

export function matchesFilters(item, state) {
  const term = state.search.trim().toLowerCase();
  if (term) {
    const enTitulo = item.titulo.toLowerCase().includes(term);
    const enDirector = item.director.toLowerCase().includes(term);
    if (!enTitulo && !enDirector) return false;
  }

  if (state.tipo !== 'Todas' && item.tipo !== state.tipo) return false;

  if (state.rating !== 'Todas') {
    const min = Number(state.rating);
    if (min === 0) {
      if (item.valoracion !== 0) return false;
    } else if (item.valoracion < min) {
      return false;
    }
  }

  return true;
}

export function filterCatalog(items, state) {
  return items.filter((item) => matchesFilters(item, state));
}

/** Más reciente primero. Las fechas son ISO, así que comparar como texto basta. */
export function sortByFecha(items) {
  return items.slice().sort((a, b) => (b.fechaVisionado || '').localeCompare(a.fechaVisionado || ''));
}
