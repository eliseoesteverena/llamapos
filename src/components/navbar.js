 /**
 * LLAMAPOS — navbar.js
 * Componente de navegación principal.
 * Se monta una sola vez en app.js.
 */

export function renderNavbar(container) {
  const routes = [
    { hash: 'pos',      label: 'Punto de Venta' },
    { hash: 'products', label: 'Productos' },
    { hash: 'clients',  label: 'Clientes' },
    { hash: 'accounts', label: 'Cuentas' },
  ];

  container.innerHTML = `
    <nav class="navbar">
      <span class="navbar__brand">🦙 LlamaPOS</span>
      <div class="navbar__nav">
        ${routes.map(r => `
          <a href="#${r.hash}" 
             class="nav-link" 
             data-route="${r.hash}">
            ${r.label}
          </a>
        `).join('')}
      </div>
    </nav>
  `;
}
