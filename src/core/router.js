 /**
 * LLAMAPOS — router.js
 * SPA Router basado en window.location.hash.
 *
 * Por qué hash routing:
 * El hash (#) funciona sin configuración de servidor.
 * Con la History API necesitarías configurar el servidor para
 * redirigir todas las rutas a index.html. Para este proyecto,
 * el hash es la opción más pragmática y portable.
 *
 * Patrón: el router recibe un mapa de rutas → funciones render.
 * Cada función render recibe el contenedor donde montar su vista.
 */

export function createRouter(routes, container) {
  const defaultRoute = Object.keys(routes)[0];

  function getHash() {
    return window.location.hash.slice(1) || defaultRoute;
  }

  function updateNavLinks(route) {
    document.querySelectorAll('[data-route]').forEach(link => {
      const linkRoute = link.getAttribute('data-route');
      link.classList.toggle('active', linkRoute === route);
    });
  }

  async function navigate(route) {
    const handler = routes[route] || routes[defaultRoute];
    if (!handler) return;

    // Limpiamos el contenedor antes de renderizar
    container.innerHTML = '';
    updateNavLinks(route);

    try {
      await handler(container);
    } catch (err) {
      console.error(`[Router] Error al renderizar ruta "${route}":`, err);
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state__icon">⚠️</div>
          <div class="empty-state__title">Error al cargar la vista</div>
          <div class="empty-state__desc">${err.message}</div>
        </div>`;
    }
  }

  // Escuchamos cambios de hash
  window.addEventListener('hashchange', () => {
    navigate(getHash());
  });

  return {
    /**
     * Inicializa el router y navega a la ruta actual.
     */
    init() {
      navigate(getHash());
    },

    /**
     * Navega programáticamente a una ruta.
     */
    go(route) {
      window.location.hash = route;
    },
  };
}
