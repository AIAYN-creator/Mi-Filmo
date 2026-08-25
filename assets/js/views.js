/**
 * Plantillas HTML. Devuelven cadenas; no consultan ni modifican el DOM.
 * Cualquier dato del catálogo se interpola siempre a través de esc().
 */

import { esc, formatDate } from './utils.js';

const REVIEW_PREVIEW_CHARS = 140;

/**
 * Cinco estrellas grises con una capa dorada recortada por porcentaje.
 * Así los medios puntos (3.5) se ven de verdad, sin medias estrellas dibujadas.
 */
export function starsHtml(rating) {
  const pct = Math.max(0, Math.min(100, (Number(rating) / 5) * 100));
  return `
    <div class="stars" role="img" aria-label="${esc(Number(rating).toFixed(1))} de 5 estrellas">
      <span aria-hidden="true">★★★★★</span>
      <span class="stars__fill" aria-hidden="true" style="width:${pct}%">★★★★★</span>
    </div>`;
}

export function tagsHtml(etiquetas) {
  return (etiquetas || [])
    .map(
      (t) =>
        `<span class="text-[0.7rem] px-2 py-0.5 rounded-full bg-brand-bg border border-brand-line text-brand-gold">${esc(t)}</span>`
    )
    .join('');
}

export function chipClass(active) {
  return `px-3 py-1.5 rounded-full text-xs border transition whitespace-nowrap ${
    active
      ? 'bg-brand-red border-brand-red text-white font-semibold'
      : 'bg-brand-bgsoft border-brand-line text-brand-textdim hover:border-brand-gold'
  }`;
}

export function cardTemplate(item) {
  const isZero = item.valoracion === 0;
  const tags = tagsHtml(item.etiquetas);
  // Se recorta por caracteres reales, no por unidades UTF-16: slice() partía por
  // la mitad los emojis que cayeran justo en el corte y dejaba un símbolo roto.
  const chars = Array.from(item.review);
  const review = chars.length > REVIEW_PREVIEW_CHARS
    ? `${chars.slice(0, REVIEW_PREVIEW_CHARS).join('')}…`
    : item.review;

  return `
    <article data-id="${esc(item.id)}" tabindex="0" role="button" aria-label="Ver detalles de ${esc(item.titulo)}"
      class="bg-brand-bgsoft border ${isZero ? 'border-brand-red/70 ring-1 ring-brand-red/40' : 'border-brand-line'} rounded-xl p-4 flex flex-col gap-3 hover:border-brand-gold/60 focus:outline-none focus:border-brand-gold transition cursor-pointer">
      <div class="flex items-start justify-between gap-2">
        <div>
          <h3 class="font-display text-lg tracking-wide text-brand-text leading-tight">${esc(item.titulo)}</h3>
          <p class="text-sm text-brand-textdim">${esc(item.director) || 'Director/a desconocido/a'}</p>
        </div>
        <span class="shrink-0 text-[0.7rem] px-2 py-1 rounded-md bg-brand-bg border border-brand-line text-brand-textdim whitespace-nowrap">${esc(item.tipo)}</span>
      </div>

      <div class="flex items-center gap-2">
        ${starsHtml(item.valoracion)}
        <span class="text-xs font-semibold ${isZero ? 'text-brand-red' : 'text-brand-textdim'}">${esc(item.valoracion.toFixed(1))}</span>
        ${isZero ? '<span class="text-[0.65rem] uppercase tracking-wide text-brand-red font-bold ml-1">Para el olvido</span>' : ''}
      </div>

      ${tags ? `<div class="flex flex-wrap gap-1.5">${tags}</div>` : ''}

      ${review ? `<p class="text-sm text-brand-textdim leading-relaxed">${esc(review)}</p>` : ''}

      <div class="flex items-center gap-1.5 text-xs text-brand-textdim mt-auto pt-2 border-t border-brand-line">
        <i data-lucide="calendar" class="w-3.5 h-3.5"></i>
        <span>${esc(formatDate(item.fechaVisionado))}</span>
      </div>
    </article>`;
}
