 /**
 * LLAMAPOS — app.js
 * Punto de entrada. Orquesta todo.
 *
 * Orden de arranque:
 * 1. Seed de datos iniciales
 * 2. Montar la navbar
 * 3. Registrar rutas en el router
 * 4. Inicializar el router (navega a la ruta inicial)
 */

import { seedInitialData } from './src/core/db.js';
import { createRouter }    from './src/core/router.js';
import { renderNavbar }    from './src/components/navbar.js';

// Importamos los controladores de cada módulo (lazy sería mejor, pero
// para este scope la carga directa es más simple y didáctica)
import { renderPOS }      from './src/modules/pos/pos.controller.js';
import { renderProducts } from './src/modules/products/products.controller.js';
import { renderClients }  from './src/modules/clients/clients.controller.js';
import { renderAccounts } from './src/modules/accounts/accounts.controller.js';

async function bootstrap() {
  // 1. Datos iniciales
  await seedInitialData();

  // 2. Navbar
  const navbarEl = document.getElementById('navbar');
  renderNavbar(navbarEl);

  // 3. Rutas
  const mainEl = document.getElementById('main');
  const router = createRouter({
    pos:      renderPOS,
    products: renderProducts,
    clients:  renderClients,
    accounts: renderAccounts,
  }, mainEl);

  // 4. Arranque
  router.init();
}

bootstrap().catch(console.error);
