 /**
 * LLAMAPOS — modal.js
 * Modal reutilizable con promesa.
 *
 * Uso:
 *   const modal = createModal({ title: 'Nuevo Producto', content: formHTML })
 *   modal.open()
 *   modal.close()
 *   modal.setContent(html)
 */

export function createModal({ title = '', content = '', footer = '' } = {}) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="btn btn-ghost modal-close" aria-label="Cerrar">✕</button>
      </div>
      <div class="modal-body">${content}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  document.body.appendChild(backdrop);

  const modalEl  = backdrop.querySelector('.modal');
  const closeBtn = backdrop.querySelector('.modal-close');
  const bodyEl   = backdrop.querySelector('.modal-body');
  const footerEl = backdrop.querySelector('.modal-footer');

  // Cerrar al hacer click en el backdrop (fuera del modal)
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  // Cerrar con botón X
  closeBtn.addEventListener('click', close);

  // Cerrar con Escape
  function onKeydown(e) {
    if (e.key === 'Escape') close();
  }

  function open() {
    document.addEventListener('keydown', onKeydown);
    backdrop.classList.add('open');
  }

  function close() {
    document.removeEventListener('keydown', onKeydown);
    backdrop.classList.remove('open');
  }

  function destroy() {
    close();
    document.removeEventListener('keydown', onKeydown);
    backdrop.remove();
  }

  function setTitle(t) {
    backdrop.querySelector('.modal-title').textContent = t;
  }

  function setContent(html) {
    bodyEl.innerHTML = html;
  }

  function setFooter(html) {
    if (footerEl) footerEl.innerHTML = html;
  }

  return { open, close, destroy, setTitle, setContent, setFooter, el: modalEl, backdrop };
}
