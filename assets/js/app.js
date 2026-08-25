/**
 * Punto de entrada: estado de la aplicación y cableado de la interfaz.
 * Es el único módulo que conoce a la vez el DOM, el modelo y la red.
 */

import { DATA_FILE, DEMO_ITEMS, TIPOS } from './config.js';
import { esc, formatDate, formatDateTime, refreshIcons } from './utils.js';
import { loadSettings, saveSettings, readCache, writeCache, clearCache } from './storage.js';
import { CatalogRepo, normalizeRepo, isValidRepo } from './github.js';
import {
  createId,
  createFilterState,
  filterCatalog,
  normalizeCatalog,
  normalizeItem,
  sortByFecha,
  RATING_FILTERS
} from './catalog.js';
import { cardTemplate, chipClass, starsHtml, tagsHtml } from './views.js';
import { initModals, openModal, closeModal } from './modals.js';

const $ = (id) => document.getElementById(id);

// --- estado ---------------------------------------------------------------

let settings = loadSettings();
let client = new CatalogRepo(settings);
let items = [];
let detailItemId = null;
let editingId = null;
const filters = createFilterState();

// --- banner de sincronización --------------------------------------------

const BANNER_STYLES = {
  local: { icon: 'info', className: 'text-brand-textdim border-brand-line' },
  loading: { icon: 'loader-2', className: 'text-brand-gold border-brand-line' },
  ok: { icon: 'check-circle-2', className: 'text-brand-gold border-brand-gold/40' },
  error: { icon: 'alert-triangle', className: 'text-brand-red border-brand-red/50' }
};

function setSyncStatus(kind, text) {
  const { icon, className } = BANNER_STYLES[kind] || BANNER_STYLES.local;
  const banner = $('syncBanner');
  banner.className = `flex items-center gap-2 text-xs bg-brand-bgsoft border rounded-lg px-3 py-2 ${className}`;
  banner.innerHTML =
    `<i data-lucide="${icon}" class="w-3.5 h-3.5 shrink-0 ${kind === 'loading' ? 'animate-spin' : ''}"></i>` +
    `<span>${esc(text)}</span>`;
  refreshIcons();
}

/** Traduce un fallo de la capa de red a algo que el usuario pueda accionar. */
function describeFailure(result) {
  switch (result.reason) {
    case 'network':
      return 'sin conexión con GitHub';
    case 'norepo':
      return 'el repositorio no existe o el token no tiene acceso';
    case 'parse':
      return `${DATA_FILE} no contiene una lista JSON válida`;
    case 'toobig':
      return `${DATA_FILE} supera 1 MB, el límite de esta API`;
    case 'unconfigured':
      return 'falta configuración';
    case 'http':
      if (result.status === 401) return 'el token no es válido o ha caducado';
      if (result.status === 403) return 'acceso denegado o límite de peticiones alcanzado';
      return `error ${result.status}${result.message ? `: ${result.message}` : ''}`;
    default:
      return 'error desconocido';
  }
}

// --- render ---------------------------------------------------------------

function render() {
  const grid = $('grid');
  const visible = sortByFecha(filterCatalog(items, filters));

  grid.innerHTML = visible.map(cardTemplate).join('');
  $('emptyState').classList.toggle('hidden', visible.length > 0);
  $('emptyState').textContent = items.length
    ? 'No hay ninguna obra que cumpla estos filtros.'
    : 'Todavía no has registrado ninguna obra.';

  updateCount(visible.length, items.length);
  refreshIcons();
}

function updateCount(shown, total) {
  const plural = total === 1 ? '' : 's';
  $('countLabel').textContent =
    shown === total
      ? `${total} obra${plural} registrada${plural}`
      : `${shown} de ${total} obras`;
}

// --- carga y guardado -----------------------------------------------------

async function loadCatalog() {
  if (!client.configured) {
    items = normalizeCatalog(DEMO_ITEMS);
    setSyncStatus('local', 'Modo demostración: no hay repositorio conectado. Ábrelo en Configuración para sincronizar.');
    render();
    return;
  }

  // La copia local se pinta antes de salir a la red: la app abre con contenido
  // incluso sin conexión, y el fetch solo confirma o corrige lo que ya se ve.
  const cached = readCache(settings.repo);
  items = cached ? normalizeCatalog(cached.items) : [];
  render();

  setSyncStatus('loading', 'Cargando catálogo desde GitHub…');
  const result = await client.read();

  if (result.ok) {
    items = normalizeCatalog(result.items);
    writeCache(settings.repo, items);
    setSyncStatus(
      'ok',
      result.empty
        ? `Conectado a ${settings.repo} — ${DATA_FILE} se creará al guardar la primera obra.`
        : `Sincronizado con ${settings.repo}`
    );
  } else {
    const detail = describeFailure(result);
    setSyncStatus(
      'error',
      cached
        ? `No se pudo actualizar (${detail}). Estás viendo la copia local del ${formatDateTime(cached.savedAt)}.`
        : `No se pudo cargar ${DATA_FILE} de ${settings.repo} (${detail}).`
    );
  }

  render();
}

/**
 * Guarda el catálogo completo y devuelve si la operación tuvo éxito.
 * Sin repositorio conectado los cambios se quedan en memoria: es el modo demo.
 */
async function persist(newItems, message) {
  if (!client.configured) {
    items = normalizeCatalog(newItems);
    setSyncStatus('local', 'Modo demostración: los cambios no se guardan. Conecta un repositorio en Configuración.');
    render();
    return true;
  }

  if (!client.writable) {
    setSyncStatus('error', 'Falta el token de GitHub. Añádelo en Configuración para poder guardar.');
    openModal('settingsModal');
    return false;
  }

  setSyncStatus('loading', 'Guardando en GitHub…');
  const result = await client.write(newItems, message);

  if (result.ok) {
    items = normalizeCatalog(newItems);
    writeCache(settings.repo, items);
    setSyncStatus('ok', `Sincronizado con ${settings.repo}`);
    render();
    return true;
  }

  if (result.reason === 'conflict') {
    const fresh = await client.read();
    if (fresh.ok) {
      items = normalizeCatalog(fresh.items);
      writeCache(settings.repo, items);
    }
    setSyncStatus(
      'error',
      'El catálogo cambió en GitHub mientras editabas. Se ha recargado la versión más reciente: repite el cambio.'
    );
    render();
    return false;
  }

  setSyncStatus('error', `No se pudo guardar en GitHub (${describeFailure(result)}).`);
  return false;
}

// --- filtros --------------------------------------------------------------

function buildChips(container, options, key) {
  container.innerHTML = '';
  options.forEach(({ value, label }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.textContent = label;
    chip.dataset.value = value;
    chip.className = chipClass(value === filters[key]);
    chip.setAttribute('aria-pressed', String(value === filters[key]));
    chip.addEventListener('click', () => {
      filters[key] = value;
      container.querySelectorAll('button').forEach((b) => {
        const active = b.dataset.value === filters[key];
        b.className = chipClass(active);
        b.setAttribute('aria-pressed', String(active));
      });
      render();
    });
    container.appendChild(chip);
  });
}

// --- detalle --------------------------------------------------------------

function openDetail(item) {
  detailItemId = item.id;
  $('detailTitulo').textContent = item.titulo;
  $('detailDirector').textContent = item.director || 'Director/a desconocido/a';
  $('detailTipo').textContent = item.tipo;
  $('detailStars').innerHTML = starsHtml(item.valoracion);
  $('detailValoracion').textContent = item.valoracion.toFixed(1);
  $('detailValoracion').className = `text-sm font-semibold ${
    item.valoracion === 0 ? 'text-brand-red' : 'text-brand-textdim'
  }`;

  const zeroBadge = $('detailZeroBadge');
  zeroBadge.textContent = 'Para el olvido';
  zeroBadge.classList.toggle('hidden', item.valoracion !== 0);

  $('detailTags').innerHTML = tagsHtml(item.etiquetas);
  $('detailReview').textContent = item.review || 'Sin review todavía.';
  $('detailFecha').textContent = formatDate(item.fechaVisionado);

  openModal('detailModal');
  refreshIcons();
}

// --- alta y edición -------------------------------------------------------

function openAddModal(item) {
  editingId = item ? item.id : null;
  $('addForm').reset();

  $('addModalTitle').textContent = item ? 'Editar Obra' : 'Añadir Nueva Obra';
  $('addSubmitBtn').textContent = item ? 'Guardar cambios' : 'Guardar';

  $('tituloInput').value = item ? item.titulo : '';
  $('directorInput').value = item ? item.director : '';
  $('tipoSelect').value = item ? item.tipo : TIPOS[0];
  $('valoracionInput').value = item ? item.valoracion : 0;
  $('etiquetasInput').value = item ? item.etiquetas.join(', ') : '';
  $('reviewInput').value = item ? item.review : '';
  $('fechaVisionadoInput').value = item ? item.fechaVisionado : new Date().toISOString().slice(0, 10);

  openModal('addModal');
}

function setFormBusy(busy) {
  const btn = $('addSubmitBtn');
  if (busy) {
    // La etiqueta cambia entre alta y edición, así que se guarda en cada bloqueo
    // en lugar de memorizar la primera para siempre.
    btn.dataset.idleLabel = btn.textContent;
    btn.textContent = 'Guardando…';
  } else {
    btn.textContent = btn.dataset.idleLabel || 'Guardar';
    delete btn.dataset.idleLabel;
  }
  btn.disabled = busy;
}

// --- cableado -------------------------------------------------------------

function wireEvents() {
  const grid = $('grid');

  grid.addEventListener('click', (e) => {
    const article = e.target.closest('[data-id]');
    if (!article) return;
    const item = items.find((x) => x.id === article.dataset.id);
    if (item) openDetail(item);
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const article = e.target.closest('[data-id]');
    if (!article) return;
    e.preventDefault();
    const item = items.find((x) => x.id === article.dataset.id);
    if (item) openDetail(item);
  });

  $('searchInput').addEventListener('input', (e) => {
    filters.search = e.target.value;
    render();
  });

  $('addBtn').addEventListener('click', () => openAddModal(null));
  $('refreshBtn').addEventListener('click', () => loadCatalog());

  $('settingsBtn').addEventListener('click', () => {
    $('repoInput').value = settings.repo;
    $('tokenInput').value = settings.token;
    $('branchInput').value = settings.branch;
    openModal('settingsModal');
  });

  $('detailEditBtn').addEventListener('click', () => {
    const item = items.find((x) => x.id === detailItemId);
    if (!item) return;
    closeModal('detailModal');
    openAddModal(item);
  });

  $('detailDeleteBtn').addEventListener('click', async () => {
    const item = items.find((x) => x.id === detailItemId);
    if (!item) return;
    if (!confirm(`¿Seguro que quieres eliminar "${item.titulo}"? Esta acción no se puede deshacer.`)) return;

    const btn = $('detailDeleteBtn');
    btn.disabled = true;
    const ok = await persist(
      items.filter((x) => x.id !== item.id),
      `Eliminar "${item.titulo}"`
    );
    btn.disabled = false;
    if (ok) closeModal('detailModal');
  });

  $('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const titulo = String(fd.get('titulo') || '').trim();
    if (!titulo) return;

    const data = normalizeItem({
      id: editingId || createId(),
      titulo,
      director: fd.get('director'),
      tipo: fd.get('tipo'),
      valoracion: fd.get('valoracion'),
      etiquetas: String(fd.get('etiquetas') || '').split(','),
      review: String(fd.get('review') || '').trim(),
      fechaVisionado: fd.get('fechaVisionado')
    });

    const newItems = editingId
      ? items.map((x) => (x.id === editingId ? data : x))
      : [data, ...items];

    setFormBusy(true);
    const ok = await persist(newItems, editingId ? `Editar "${titulo}"` : `Añadir "${titulo}"`);
    setFormBusy(false);

    if (ok) {
      editingId = null;
      e.target.reset();
      closeModal('addModal');
    }
  });

  $('settingsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const repo = normalizeRepo($('repoInput').value);
    const token = $('tokenInput').value.trim();
    const branch = $('branchInput').value.trim() || 'main';

    if (repo && !isValidRepo(repo)) {
      alert('Formato de repositorio no válido. Usa "usuario/repositorio".');
      return;
    }

    // Cambiar de repositorio invalida la copia local: pertenece al anterior.
    if (repo !== settings.repo) clearCache();

    settings = { repo, token, branch };
    saveSettings(settings);
    client = new CatalogRepo(settings);

    closeModal('settingsModal');
    await loadCatalog();
  });
}

// --- arranque -------------------------------------------------------------

function populateTipoSelect() {
  $('tipoSelect').innerHTML = TIPOS.map((t) => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
}

function bootstrap() {
  populateTipoSelect();
  buildChips($('tipoFilters'), [{ value: 'Todas', label: 'Todas' }, ...TIPOS.map((t) => ({ value: t, label: t }))], 'tipo');
  buildChips($('ratingFilters'), RATING_FILTERS, 'rating');
  initModals();
  wireEvents();
  loadCatalog();
}

bootstrap();
