/**
 * Constantes compartidas por toda la app.
 * Este módulo no importa nada: es la hoja del árbol de dependencias.
 */

export const APP_NAME = 'Mi Filmo';

/** Archivo de datos dentro del repositorio conectado. */
export const DATA_FILE = 'peliculas.json';

/** Rama usada cuando el usuario no configura otra. */
export const DEFAULT_BRANCH = 'main';

/**
 * Tipos de obra admitidos. Este array es la única fuente de verdad:
 * alimenta los chips de filtro y el <select> del formulario.
 */
export const TIPOS = [
  'Película',
  'Serie',
  'Documental',
  'Cortometraje',
  'Ensayo Audiovisual',
  'Otro'
];

/** Claves de localStorage, prefijadas para no chocar con otras apps del mismo origen. */
export const STORAGE_KEYS = {
  repo: 'miFilmo_repo',
  token: 'miFilmo_token',
  branch: 'miFilmo_branch',
  cache: 'miFilmo_cache'
};

/**
 * Catálogo de ejemplo. Solo se muestra cuando NO hay repositorio conectado,
 * nunca como sustituto de datos reales que no se han podido cargar.
 */
export const DEMO_ITEMS = [
  {
    id: 'demo-001',
    titulo: 'Stalker',
    director: 'Andrei Tarkovsky',
    tipo: 'Película',
    valoracion: 5,
    etiquetas: ['Fotografía', 'Obra Maestra', 'Filosofía'],
    review: 'Una atmósfera insuperable. Cada plano es una pintura en sí mismo.',
    fechaVisionado: '2026-07-28'
  },
  {
    id: 'demo-002',
    titulo: 'Bodrio Espacial 3',
    director: 'Anónimo',
    tipo: 'Película',
    valoracion: 0,
    etiquetas: ['Guion nefasto', 'Pérdida de tiempo'],
    review: '0 estrellas bien merecidas. Infumable.',
    fechaVisionado: '2026-07-30'
  }
];
