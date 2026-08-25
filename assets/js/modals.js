/**
 * Gestión de modales: apertura, cierre y devolución del foco.
 *
 * Se mantiene una pila para que Escape cierre solo el modal de arriba, ya que
 * "Configuración" puede abrirse encima del formulario cuando falta el token.
 */

const stack = [];
const previousFocus = new Map();

export function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal || stack.includes(id)) return;

  previousFocus.set(id, document.activeElement);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
  stack.push(id);

  // Primer control enfocable del modal, para no dejar el foco detrás del overlay.
  const focusable = modal.querySelector('input, select, textarea, button');
  if (focusable) focusable.focus();
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add('hidden');
  modal.classList.remove('flex');

  const index = stack.indexOf(id);
  if (index !== -1) stack.splice(index, 1);

  const previous = previousFocus.get(id);
  previousFocus.delete(id);
  if (previous && document.contains(previous)) previous.focus();
}

export function closeTopModal() {
  if (stack.length) closeModal(stack[stack.length - 1]);
}

/** Cablea los cierres genéricos: botón con [data-close-modal], clic en el fondo y Escape. */
export function initModals() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
  });

  document.querySelectorAll('[data-modal]').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTopModal();
  });
}
