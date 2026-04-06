 /**
 * LLAMAPOS — store.js
 * Estado global con patrón Observer.
 *
 * Por qué este patrón:
 * Sin un store central, cada módulo mantendría su propio estado
 * y sincronizarlos sería un caos. Con el Observer, cualquier módulo
 * puede publicar un cambio y cualquier otro puede reaccionar.
 * Es exactamente lo que Redux o Zustand hacen, pero en 60 líneas.
 */

function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = {};

  return {
    /**
     * Obtiene el estado actual (inmutable desde afuera).
     */
    getState() {
      return { ...state };
    },

    /**
     * Actualiza el estado y notifica a los suscriptores.
     * @param {Object} partial — solo los campos que cambian
     */
    setState(partial) {
      state = { ...state, ...partial };
      const keys = Object.keys(partial);
      keys.forEach(key => {
        if (listeners[key]) {
          listeners[key].forEach(fn => fn(state[key], state));
        }
      });
      // Siempre notificamos el evento global '*'
      if (listeners['*']) {
        listeners['*'].forEach(fn => fn(state));
      }
    },

    /**
     * Suscribe un callback al cambio de una clave de estado.
     * @param {string} key — clave del estado, o '*' para cualquier cambio
     * @param {Function} callback
     * @returns {Function} función para desuscribirse (útil al destruir vistas)
     */
    on(key, callback) {
      if (!listeners[key]) listeners[key] = [];
      listeners[key].push(callback);
      return () => {
        listeners[key] = listeners[key].filter(fn => fn !== callback);
      };
    },
  };
}

// Estado inicial de la aplicación
export const store = createStore({
  // Usuario / sesión
  currentUser: null,

  // Vista activa
  currentRoute: null,

  // Carrito del POS activo
  cart: [],
  cartClient: null,

  // Datos cacheados en sesión (cargados desde db.js)
  products: [],
  clients: [],
  sales: [],
});
