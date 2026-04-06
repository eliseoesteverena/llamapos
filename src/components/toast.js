 /**
 * LLAMAPOS — toast.js
 * Sistema de notificaciones no bloqueantes.
 *
 * Uso:
 *   import { toast } from './toast.js'
 *   toast.success('Producto guardado')
 *   toast.error('Error al procesar')
 *   toast.warning('Stock bajo')
 */

let _container = null;

function getContainer() {
  if (_container) return _container;
  _container = document.createElement('div');
  _container.className = 'toast-container';
  document.body.appendChild(_container);
  return _container;
}

function show(message, type = '', duration = 3000) {
  const container = getContainer();
  const el = document.createElement('div');
  el.className = `toast ${type ? `toast-${type}` : ''}`;
  el.textContent = message;
  container.appendChild(el);

  // Activamos la animación en el siguiente frame
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => el.remove(), { once: true });
  }, duration);
}

export const toast = {
  success: (msg) => show(msg, 'success'),
  error:   (msg) => show(msg, 'danger'),
  warning: (msg) => show(msg, 'warning'),
  info:    (msg) => show(msg, ''),
};
