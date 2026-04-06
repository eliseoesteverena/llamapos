/**
 * LLAMAPOS — pos.controller.js
 *
 * Cambios clave:
 * - Event delegation en el carrito: un solo listener en #pos-cart,
 *   nunca se pierde aunque se re-renderice innerHTML.
 * - Lista en mobile, grilla en desktop (clase css + media query).
 * - Validación completa antes de cobrar/cargar a cuenta.
 */
import { db }    from '../../core/db.js';
import { toast } from '../../components/toast.js';
import { renderPOSView } from './pos.view.js';

let _products = [];
let _clients  = [];
let _cart     = [];
let _filter   = 'Todos';
let _search   = '';

const fmt = n => '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 });

function isDecimalProduct(p) {
  const units = ['peso', 'longitud', 'volumen', 'granel', 'metro', 'kg', 'litro', 'gramo', 'ml', 'cm'];
  return units.some(u => (p.unit || p.category || '').toLowerCase().includes(u));
}

// ─── Grid de productos ────────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('pos-grid');
  if (!grid) return;

  const term = _search.toLowerCase();
  const filtered = _products.filter(p => {
    if (!p.active) return false;
    const matchCat    = _filter === 'Todos' || p.category === _filter;
    const matchSearch = !term ||
      p.name.toLowerCase().includes(term) ||
      (p.sku || '').toLowerCase().includes(term);
    return matchCat && matchSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:2rem 0">
        <div class="empty-state__icon">🔍</div>
        <div class="empty-state__desc">Sin resultados para la búsqueda</div>
      </div>`;
    return;
  }

  // Renderizamos con dos variantes en el mismo HTML:
  // .product-card  → visible en desktop (grid)
  // .product-row   → visible en mobile (lista)
  // CSS se encarga de mostrar/ocultar según viewport
  grid.innerHTML = filtered.map(p => {
    const outOfStock = p.trackStock !== false && p.stock === 0;
    const unitLabel  = p.unit ? ` / ${p.unit}` : '';
    return `
      <div class="product-card ${outOfStock ? 'out-of-stock' : ''}"
           data-id="${p.id}" role="button" tabindex="0"
           title="${outOfStock ? 'Sin stock' : `Stock: ${p.stock}`}">
        <div class="product-card__name">${p.name}</div>
        ${p.sku ? `<div class="product-card__sku">${p.sku}</div>` : ''}
        <div class="product-card__price">${fmt(p.price)}${unitLabel}</div>
        ${p.trackStock !== false
          ? `<div class="product-card__stock ${p.stock <= 5 && p.stock > 0 ? 'low' : ''}">Stock: ${p.stock}</div>`
          : `<div class="product-card__stock" style="font-style:italic">Servicio</div>`
        }
      </div>`;
  }).join('');

  // Un solo listener delegado en el contenedor del grid
  grid.querySelectorAll('.product-card:not(.out-of-stock)').forEach(card => {
    const handler = () => {
      const product = _products.find(pr => pr.id === card.dataset.id);
      if (product) addToCart(product);
    };
    card.addEventListener('click', handler);
    card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') handler(); });
  });
}

// ─── Categorías ───────────────────────────────────────────────
function renderCategories() {
  const el = document.getElementById('pos-categories');
  if (!el) return;
  const cats = ['Todos', ...new Set(
    _products.filter(p => p.active).map(p => p.category).filter(Boolean)
  )];
  el.innerHTML = cats.map(c =>
    `<button class="category-chip ${_filter === c ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  el.querySelectorAll('.category-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      _filter = btn.dataset.cat;
      renderCategories();
      renderGrid();
    });
  });
}

// ─── Carrito ──────────────────────────────────────────────────
function addToCart(product) {
  const line    = _cart.find(l => l.product.id === product.id);
  const decimal = isDecimalProduct(product);
  const step    = decimal ? 0.1 : 1;

  if (line) {
    if (product.trackStock !== false && !decimal && line.qty >= product.stock) {
      toast.warning(`Stock máximo disponible: ${product.stock}`);
      return;
    }
    line.qty = parseFloat((line.qty + step).toFixed(3));
  } else {
    _cart.push({ product, qty: step });
  }
  renderCart();
  updateCartBadge();
}

function removeFromCart(productId) {
  _cart = _cart.filter(l => l.product.id !== productId);
  renderCart();
  updateCartBadge();
}

function applyQtyChange(productId, newQtyRaw) {
  const line = _cart.find(l => l.product.id === productId);
  if (!line) return;

  const decimal = isDecimalProduct(line.product);
  const qty     = parseFloat(parseFloat(newQtyRaw).toFixed(3));

  if (isNaN(qty) || qty <= 0) {
    removeFromCart(productId);
    return;
  }
  if (line.product.trackStock !== false && !decimal && qty > line.product.stock) {
    toast.warning(`Stock máximo disponible: ${line.product.stock}`);
    // Restaurar al máximo permitido
    line.qty = line.product.stock;
    renderCart();
    updateCartBadge();
    return;
  }
  line.qty = qty;
  // Solo actualizamos totales y el subtotal de la línea, sin re-renderizar todo
  updateLineTotals(productId);
}

// Actualiza solo el subtotal de una línea y los totales globales
// sin destruir el DOM → preserva el foco del input
function updateLineTotals(productId) {
  const line = _cart.find(l => l.product.id === productId);
  if (!line) return;

  // Actualizar subtotal de la línea
  const subtotalEl = document.querySelector(
    `.cart-line[data-id="${productId}"] .cart-line__subtotal`
  );
  if (subtotalEl) subtotalEl.textContent = fmt(line.product.price * line.qty);

  renderTotals();
}

function clearCart() {
  _cart = [];
  renderCart();
  updateCartBadge();
}

// ─── Render del carrito ───────────────────────────────────────
// Se llama solo cuando la ESTRUCTURA cambia (agregar/quitar items).
// Para cambios de cantidad usa updateLineTotals().
function renderCart() {
  const cartEl = document.getElementById('pos-cart');
  if (!cartEl) return;

  if (_cart.length === 0) {
    cartEl.innerHTML = `
      <div class="empty-state" style="padding:1.5rem 0">
        <div class="empty-state__icon">🛒</div>
        <div class="empty-state__desc">Agregá productos al carrito</div>
      </div>`;
    renderTotals();
    return;
  }

  cartEl.innerHTML = _cart.map(line => {
    const decimal  = isDecimalProduct(line.product);
    const step     = decimal ? 0.001 : 1;
    const minVal   = decimal ? 0.001 : 1;
    const maxVal   = decimal ? '' : line.product.stock;
    const unitLbl  = line.product.unit ? line.product.unit : 'u';

    return `
      <div class="cart-line" data-id="${line.product.id}">
        <div class="cart-line__info">
          <div class="cart-line__name">${line.product.name}</div>
          <div class="cart-line__unit-price">${fmt(line.product.price)} / ${unitLbl}</div>
        </div>
        <div class="cart-line__right">
          <div class="cart-line__qty-row">
            <button class="cart-qty-btn" data-action="dec" data-id="${line.product.id}"
                    aria-label="Disminuir">−</button>
            <input
              class="cart-qty-input"
              type="number"
              value="${line.qty}"
              min="${minVal}"
              ${maxVal ? `max="${maxVal}"` : ''}
              step="${step}"
              data-id="${line.product.id}"
              aria-label="Cantidad de ${line.product.name}"
            >
            <button class="cart-qty-btn" data-action="inc" data-id="${line.product.id}"
                    aria-label="Aumentar">+</button>
          </div>
          <div class="cart-line__subtotal" data-id="${line.product.id}">
            ${fmt(line.product.price * line.qty)}
          </div>
          <button class="cart-line__remove" data-id="${line.product.id}"
                  aria-label="Quitar ${line.product.name}">✕ quitar</button>
        </div>
      </div>`;
  }).join('');

  // ── Event delegation: UN solo listener en el carrito ──────
  // Al re-renderizar, removeEventListener viejo ya no importa
  // porque el elemento fue reemplazado. Agregamos fresh listeners.
  cartEl.addEventListener('click', cartClickHandler, { once: false });
  cartEl.addEventListener('input', cartInputHandler, { once: false });
  cartEl.addEventListener('change', cartChangeHandler, { once: false });

  renderTotals();
}

// Manejador de clicks delegado — cubre botones +/−/quitar
function cartClickHandler(e) {
  const btn = e.target.closest('[data-action]');
  const removeBtn = e.target.closest('.cart-line__remove');

  if (removeBtn) {
    removeFromCart(removeBtn.dataset.id);
    return;
  }

  if (!btn) return;
  const id      = btn.dataset.id;
  const line    = _cart.find(l => l.product.id === id);
  if (!line) return;

  const decimal = isDecimalProduct(line.product);
  const step    = decimal ? 0.1 : 1;
  const sign    = btn.dataset.action === 'inc' ? 1 : -1;
  const newQty  = parseFloat((line.qty + sign * step).toFixed(3));

  if (newQty <= 0) {
    removeFromCart(id);
    return;
  }
  if (line.product.trackStock !== false && !decimal && newQty > line.product.stock) {
    toast.warning(`Stock máximo: ${line.product.stock}`);
    return;
  }

  line.qty = newQty;

  // Actualizar el input visualmente sin re-renderizar todo
  const input = document.querySelector(`.cart-qty-input[data-id="${id}"]`);
  if (input) input.value = newQty;

  updateLineTotals(id);
  updateCartBadge();
}

// Manejador de input en tiempo real (mientras tipea)
function cartInputHandler(e) {
  const input = e.target.closest('.cart-qty-input');
  if (!input) return;
  // Actualizar subtotal en tiempo real mientras escribe
  const line = _cart.find(l => l.product.id === input.dataset.id);
  if (!line) return;
  const qty = parseFloat(input.value);
  if (!isNaN(qty) && qty > 0) {
    line.qty = parseFloat(qty.toFixed(3));
    updateLineTotals(input.dataset.id);
    updateCartBadge();
  }
}

// Manejador de change (cuando sale del input o presiona Enter)
function cartChangeHandler(e) {
  const input = e.target.closest('.cart-qty-input');
  if (!input) return;
  applyQtyChange(input.dataset.id, input.value);
}

function renderTotals() {
  const total = _cart.reduce((s, l) => s + l.product.price * l.qty, 0);
  const t = document.getElementById('pos-total');
  if (t) t.textContent = fmt(total);
}

function updateCartBadge() {
  const badge  = document.getElementById('pos-cart-badge');
  const toggle = document.getElementById('pos-cart-toggle');
  if (!badge) return;
  const count = _cart.reduce((s, l) => s + 1, 0); // items únicos
  badge.textContent    = count;
  badge.style.display  = count > 0 ? 'inline' : 'none';
  if (toggle) {
    const label = toggle.querySelector('.toggle-label');
    if (label) label.textContent = count > 0 ? `Carrito (${count})` : 'Ver carrito';
  }
}

// ─── Validación antes de cobrar ───────────────────────────────
function validateCart(chargeToAccount) {
  if (_cart.length === 0) {
    toast.warning('El carrito está vacío');
    return false;
  }

  // Validar que todos los inputs de cantidad tengan valores válidos
  const inputs = document.querySelectorAll('.cart-qty-input');
  for (const input of inputs) {
    const qty = parseFloat(input.value);
    if (isNaN(qty) || qty <= 0) {
      toast.error(`Cantidad inválida para "${input.getAttribute('aria-label')?.replace('Cantidad de ', '') || 'un producto'}"`);
      input.focus();
      input.select();
      return false;
    }
  }

  // Validar stock para productos con control de stock activo
  for (const line of _cart) {
    if (line.product.trackStock !== false && !isDecimalProduct(line.product) && line.qty > line.product.stock) {
      toast.error(`Stock insuficiente para "${line.product.name}" (disponible: ${line.product.stock})`);
      return false;
    }
  }

  const clientSelect = document.getElementById('pos-client');
  const clientId     = clientSelect?.value || '';
  if (chargeToAccount && !clientId) {
    toast.error('Seleccioná un cliente para cargar a cuenta corriente');
    clientSelect?.focus();
    return false;
  }

  return true;
}

// ─── Checkout ─────────────────────────────────────────────────
async function processSale(chargeToAccount = false) {
  if (!validateCart(chargeToAccount)) return;

  const clientSelect = document.getElementById('pos-client');
  const clientId     = clientSelect?.value || '';
  const total = _cart.reduce((s, l) => s + l.product.price * l.qty, 0);

  const saleData = {
    clientId,
    clientName: clientSelect?.options[clientSelect.selectedIndex]?.text || 'Consumidor Final',
    lines: _cart.map(l => ({
      productId:   l.product.id,
      productName: l.product.name,
      price:       l.product.price,
      qty:         l.qty,
      unit:        l.product.unit || 'u',
      subtotal:    parseFloat((l.product.price * l.qty).toFixed(2)),
    })),
    total,
    paymentMethod: chargeToAccount ? 'cuenta_corriente' : 'efectivo',
    status: 'completed',
    date: new Date().toISOString(),
  };

  try {
    const sale = await db.insert('sales', saleData);

    // Descontar stock solo si trackStock está activo
    for (const line of _cart) {
      if (line.product.trackStock === false) continue;
      const newStock = isDecimalProduct(line.product)
        ? parseFloat((line.product.stock - line.qty).toFixed(3))
        : line.product.stock - Math.floor(line.qty);
      await db.update('products', line.product.id, { stock: Math.max(newStock, 0) });
    }

    if (chargeToAccount && clientId) {
      const accounts = await db.query('accounts', a => a.clientId === clientId);
      if (accounts.length > 0) {
        const acc = accounts[0];
        await db.update('accounts', acc.id, { balance: (acc.balance || 0) + total });
        await db.insert('account_movements', {
          accountId: acc.id, clientId, type: 'debit',
          amount: total, description: 'Venta', saleId: sale.id,
        });
      } else {
        const newAcc = await db.insert('accounts', {
          clientId, clientName: saleData.clientName, balance: total, credit_limit: 0,
        });
        await db.insert('account_movements', {
          accountId: newAcc.id, clientId, type: 'debit',
          amount: total, description: 'Primera venta',
        });
      }
      toast.success(`Cargado a cuenta: ${fmt(total)}`);
    } else {
      toast.success(`Venta registrada: ${fmt(total)}`);
    }

    _products = await db.getAll('products');
    clearCart();
    renderGrid();

  } catch (err) {
    console.error(err);
    toast.error('Error al procesar la venta');
  }
}

// ─── Select de clientes ───────────────────────────────────────
function renderClientSelect() {
  const el = document.getElementById('pos-client');
  if (!el) return;
  el.innerHTML = `<option value="">— Consumidor Final —</option>` +
    _clients
      .filter(c => c.active && c.name !== 'Consumidor Final')
      .map(c => `<option value="${c.id}">${c.name}</option>`)
      .join('');
}

// ─── Toggle carrito en mobile ─────────────────────────────────
function initCartToggle() {
  const btn   = document.getElementById('pos-cart-toggle');
  const inner = document.getElementById('pos-sidebar-inner');
  if (!btn || !inner) return;
  btn.addEventListener('click', () => {
    const open = inner.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
}

// ─── Entry point ──────────────────────────────────────────────
export async function renderPOS(container) {
  container.innerHTML = renderPOSView();

  [_products, _clients] = await Promise.all([
    db.getAll('products'),
    db.getAll('clients'),
  ]);
  _cart = []; _filter = 'Todos'; _search = '';

  renderCategories();
  renderGrid();
  renderCart();
  renderClientSelect();
  initCartToggle();

  document.getElementById('pos-search')?.addEventListener('input', e => {
    _search = e.target.value;
    renderGrid();
  });
  document.getElementById('pos-btn-checkout')?.addEventListener('click', () => processSale(false));
  document.getElementById('pos-btn-account')?.addEventListener('click',  () => processSale(true));
  document.getElementById('pos-btn-clear')?.addEventListener('click', () => {
    if (_cart.length === 0) return;
    clearCart();
    toast.info('Carrito limpiado');
  });
}
