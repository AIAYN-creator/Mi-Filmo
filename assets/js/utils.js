/** Utilidades sin estado: formateo y escapado. */

const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

/**
 * Escapa texto antes de interpolarlo en una plantilla que acabará en innerHTML.
 * Todo dato que venga del JSON pasa por aquí sin excepción.
 */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => HTML_ENTITIES[c]);
}

/** Convierte "2026-08-05" en "5 ago 2026". */
export function formatDate(str) {
  if (!str) return 'Sin fecha';
  // El sufijo de hora evita que la fecha se interprete como UTC y retroceda un día.
  const date = new Date(`${str}T00:00:00`);
  if (Number.isNaN(date.getTime())) return str;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Convierte un timestamp en "5 ago 2026, 19:32". Se usa para fechar la copia local. */
export function formatDateTime(ms) {
  if (!Number.isFinite(ms)) return 'fecha desconocida';
  return new Date(ms).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/** Redibuja los iconos de Lucide tras insertar HTML nuevo en el DOM. */
export function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
