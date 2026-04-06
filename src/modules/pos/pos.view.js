/**
 * LLAMAPOS — pos.view.js
 */
export function renderPOSView() {
  return `
    <div class="pos-layout">

      <!-- ═══ CATÁLOGO ═══ -->
      <section class="pos-catalog">
        <div class="pos-catalog__toolbar">
          <div class="search-bar" style="flex:1">
            <span class="search-bar__icon">⌕</span>
            <input type="text" id="pos-search"
                   placeholder="Buscar producto o SKU…"
                   autocomplete="off" style="width:100%">
          </div>
        </div>
        <div id="pos-categories" class="pos-categories"></div>
        <div id="pos-grid" class="pos-grid"></div>
      </section>

      <!-- ═══ CARRITO ═══ -->
      <aside class="pos-sidebar">

        <!-- Solo visible en mobile -->
        <button class="pos-cart-toggle" id="pos-cart-toggle" aria-expanded="false">
          <span class="toggle-label">🛒 Ver carrito</span>
          <span id="pos-cart-badge" class="cart-badge" style="display:none">0</span>
          <span class="toggle-arrow" aria-hidden="true">▲</span>
        </button>

        <div class="pos-sidebar-inner" id="pos-sidebar-inner">

          <!-- Cliente -->
          <div class="pos-section pos-client-selector">
            <label class="form-label" for="pos-client">Cliente</label>
            <select id="pos-client" style="width:100%">
              <option value="">Cargando…</option>
            </select>
          </div>

          <!-- Líneas del carrito -->
          <div id="pos-cart" class="pos-cart"></div>

          <!-- Total único -->
          <div class="pos-total-bar">
            <span class="pos-total-bar__label">TOTAL</span>
            <span id="pos-total" class="pos-total-bar__amount">$ 0,00</span>
          </div>

          <!-- Acciones: 🗑 | Cobrar -->
          <div class="pos-actions">
            <button id="pos-btn-clear" class="btn btn-secondary pos-btn-trash"
                    title="Limpiar carrito" aria-label="Limpiar carrito">
              🗑
            </button>
            <button id="pos-btn-checkout" class="btn btn-primary pos-btn-checkout">
              ✓ Cobrar
            </button>
          </div>

          <!-- Cargar a cuenta en línea propia -->
          <button id="pos-btn-account" class="btn btn-secondary btn-block">
            📒 Cargar a Cuenta Corriente
          </button>

        </div>
      </aside>
    </div>

    <style>
    /* ══════════════════════════════════════════════════
       LAYOUT
    ══════════════════════════════════════════════════ */
    .pos-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: var(--space-4);
      /* Ocupa exactamente el alto disponible bajo la navbar */
      height: calc(100vh - var(--navbar-h) - var(--space-6) * 2);
      min-height: 0;
    }

    /* ── Catálogo ── */
    .pos-catalog {
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      min-height: 0;
      overflow: hidden;
    }
    .pos-catalog__toolbar { display: flex; gap: var(--space-3); flex-shrink: 0; }
    .pos-categories {
      display: flex;
      gap: var(--space-2);
      flex-wrap: wrap;
      flex-shrink: 0;
    }
    .category-chip {
      padding: 4px 12px;
      border-radius: 99px;
      border: 1px solid var(--color-border);
      background: var(--color-surface);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      color: var(--color-muted);
      white-space: nowrap;
      transition: background 0.1s, border-color 0.1s, color 0.1s;
    }
    .category-chip:hover  { background: var(--color-bg); color: var(--color-text); }
    .category-chip.active { background: var(--color-accent); border-color: var(--color-accent); color: #fff; }

    /* Grid de productos */
    .pos-grid {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-3);
      align-content: start;
    }
    .product-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-3);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 4px;
      user-select: none;
      transition: border-color 0.12s, transform 0.1s, box-shadow 0.12s;
    }
    .product-card:hover:not(.out-of-stock) {
      border-color: var(--color-accent);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(37,99,235,0.10);
    }
    .product-card:active:not(.out-of-stock) { transform: translateY(0); }
    .product-card.out-of-stock { opacity: 0.4; cursor: not-allowed; }
    .product-card__name  { font-size: var(--text-sm); font-weight: 600; line-height: 1.3; word-break: break-word; }
    .product-card__sku   { font-size: var(--text-xs); color: var(--color-muted); font-family: var(--font-mono); }
    .product-card__price { font-size: var(--text-sm); font-weight: 700; font-family: var(--font-mono); color: var(--color-accent); margin-top: auto; padding-top: 6px; }
    .product-card__stock { font-size: var(--text-xs); color: var(--color-muted); }
    .product-card__stock.low { color: var(--color-warning); font-weight: 600; }

    /* ══════════════════════════════════════════════════
       SIDEBAR — Carrito
    ══════════════════════════════════════════════════ */
    .pos-sidebar {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
    }
    .pos-cart-toggle { display: none; }

    .pos-sidebar-inner {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      /* Separación generosa entre secciones */
      gap: var(--space-4);
      padding: var(--space-5);
      overflow: hidden;
    }

    /* Separador visual entre secciones */
    .pos-section {
      padding-bottom: var(--space-4);
      border-bottom: 1px solid var(--color-border);
    }

    /* ── Lista de items ── */
    .pos-cart {
      flex: 1;
      overflow-y: auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      /* Espacio interno entre líneas */
      gap: var(--space-1);
    }

    .cart-line {
      display: grid;
      /* Nombre | Controles+subtotal */
      grid-template-columns: 1fr auto;
      gap: var(--space-3);
      align-items: center;
      /* Padding vertical generoso → respiro entre filas */
      padding: var(--space-3) 0;
      border-bottom: 1px solid var(--color-border);
    }
    .cart-line:last-child { border-bottom: none; }

    .cart-line__info { min-width: 0; }
    .cart-line__name {
      font-size: var(--text-sm);
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 2px;
    }
    .cart-line__unit-price {
      font-size: var(--text-xs);
      color: var(--color-muted);
      font-family: var(--font-mono);
    }

    .cart-line__right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--space-2);
    }

    /* Fila: − [input] + */
    .cart-line__qty-row {
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }
    .cart-qty-btn {
      width: 30px; height: 30px;
      border-radius: var(--radius);
      border: 1px solid var(--color-border);
      background: var(--color-bg);
      font-size: 1.1rem;
      font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      flex-shrink: 0;
      line-height: 1;
      transition: background 0.1s, border-color 0.1s;
    }
    .cart-qty-btn:hover { background: var(--color-border); }
    .cart-qty-btn:active { background: var(--color-accent); color: #fff; border-color: var(--color-accent); }

    .cart-qty-input {
      width: 58px;
      height: 30px;
      text-align: center;
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-mono);
      padding: 0 4px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius);
      background: var(--color-surface);
      color: var(--color-text);
      -moz-appearance: textfield;
    }
    .cart-qty-input::-webkit-outer-spin-button,
    .cart-qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .cart-qty-input:focus { border-color: var(--color-accent); outline: none; }

    /* Subtotal de línea */
    .cart-line__subtotal {
      font-size: var(--text-sm);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text);
    }

    /* Quitar */
    .cart-line__remove {
      font-size: var(--text-xs);
      color: var(--color-muted);
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      line-height: 1;
    }
    .cart-line__remove:hover { color: var(--color-danger); }

    /* ── Barra de total ── */
    .pos-total-bar {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-4) var(--space-2);
      border-top: 2px solid var(--color-text);
      border-bottom: 1px solid var(--color-border);
    }
    .pos-total-bar__label {
      font-size: var(--text-sm);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-muted);
    }
    .pos-total-bar__amount {
      font-size: var(--text-2xl);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text);
    }

    /* ── Acciones ── */
    .pos-actions {
      flex-shrink: 0;
      display: flex;
      gap: var(--space-2);
    }
    /* Basurero: 22% */
    .pos-btn-trash {
      flex: 0 0 22%;
      font-size: 1.1rem;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Altura explícita para que coincida con el botón cobrar */
      min-height: 44px;
    }
    /* Cobrar: resto del ancho */
    .pos-btn-checkout {
      flex: 1;
      font-size: var(--text-base);
      font-weight: 700;
      min-height: 44px;
    }

    /* Cargar a cuenta: fila propia */
    #pos-btn-account {
      flex-shrink: 0;
    }

    /* Badge */
    .cart-badge {
      background: var(--color-accent);
      color: #fff;
      border-radius: 99px;
      font-size: var(--text-xs);
      font-weight: 700;
      padding: 1px 8px;
    }

    /* ══════════════════════════════════════════════════
       MOBILE
    ══════════════════════════════════════════════════ */
    @media (max-width: 860px) {
      .pos-layout {
        grid-template-columns: 1fr;
        height: auto;
        padding-bottom: 60px;
      }
      .pos-catalog { overflow: visible; height: auto; }

      /* Lista en mobile */
      .pos-grid {
        display: flex !important;
        flex-direction: column;
        gap: var(--space-2);
        overflow-y: visible;
        flex: unset;
      }
      .product-card {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius);
        gap: var(--space-3);
      }
      .product-card__name  { font-size: var(--text-base); }
      .product-card__price { margin-top: 0; padding-top: 0; font-size: var(--text-base); white-space: nowrap; flex-shrink: 0; }
      .product-card__stock,
      .product-card__sku   { display: none; }

      /* Panel deslizable */
      .pos-sidebar {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        border-bottom: none; border-left: none; border-right: none;
        z-index: 50;
        max-height: 80vh;
        box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
      }
      .pos-cart-toggle {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-3) var(--space-4);
        font-size: var(--text-sm);
        font-weight: 600;
        width: 100%;
        background: var(--color-surface);
        border: none;
        border-bottom: 1px solid var(--color-border);
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
        cursor: pointer;
        flex-shrink: 0;
      }
      .toggle-arrow {
        font-size: var(--text-xs);
        transition: transform 0.2s;
        color: var(--color-muted);
      }
      .pos-cart-toggle[aria-expanded="true"] .toggle-arrow { transform: rotate(180deg); }

      .pos-sidebar-inner {
        display: none;
        max-height: calc(80vh - 52px);
        overflow-y: auto;
        /* En mobile el inner hace scroll propio */
        gap: var(--space-3);
        padding: var(--space-4);
      }
      .pos-sidebar-inner.open { display: flex; }

      .pos-total-bar__amount { font-size: var(--text-xl); }
    }
    </style>
  `;
}
