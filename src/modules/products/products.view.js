/**
 * LLAMAPOS — products.view.js
 *
 * Campo trackStock: checkbox que habilita/deshabilita el control de stock.
 * Cuando está desactivado, la columna stock muestra "—" y no se descuenta en ventas.
 */
export function renderProductsView() {
  return `
    <div class="page-header flex-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Productos</h1>
        <p class="text-muted text-sm mt-1">Administrá tu catálogo de productos y servicios</p>
      </div>
      <button id="btn-new-product" class="btn btn-primary">+ Nuevo producto</button>
    </div>

    <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;margin-bottom:var(--space-4)">
      <div class="search-bar" style="flex:1;min-width:180px">
        <span class="search-bar__icon">⌕</span>
        <input type="text" id="products-search" placeholder="Buscar nombre o SKU…" style="width:100%">
      </div>
      <select id="products-filter-cat" style="min-width:140px;max-width:100%">
        <option value="">Todas las categorías</option>
      </select>
      <select id="products-filter-status" style="min-width:110px">
        <option value="">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <div class="grid grid-4 mb-6" id="products-stats"></div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Categoría</th>
              <th class="text-right">Precio</th>
              <th class="text-right">Stock</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="products-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- ── Modal ── -->
    <div id="product-modal-backdrop" class="modal-backdrop">
      <div class="modal" style="max-width:520px">
        <div class="modal-header">
          <span class="modal-title" id="product-modal-title">Nuevo producto</span>
          <button class="btn btn-ghost" id="product-modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="product-form" novalidate>
            <div class="pf-grid">

              <!-- Nombre — ancho completo -->
              <div class="form-group pf-full">
                <label class="form-label">Nombre *</label>
                <input type="text" name="name" required placeholder="Ej: Consultoría 1h" style="width:100%">
              </div>

              <!-- SKU / Categoría -->
              <div class="form-group">
                <label class="form-label">SKU</label>
                <input type="text" name="sku" placeholder="Ej: SRV-001" style="width:100%">
              </div>
              <div class="form-group">
                <label class="form-label">Categoría</label>
                <input type="text" name="category" list="cat-list" placeholder="Ej: Servicios" style="width:100%">
                <datalist id="cat-list"></datalist>
              </div>

              <!-- Precio / Unidad -->
              <div class="form-group">
                <label class="form-label">Precio *</label>
                <input type="number" name="price" required min="0" step="0.001"
                       placeholder="0.000" style="width:100%">
              </div>
              <div class="form-group">
                <label class="form-label">Unidad</label>
                <input type="text" name="unit" list="unit-list"
                       placeholder="Ej: hora, kg, metro" style="width:100%">
                <datalist id="unit-list">
                  <option value="unidad"><option value="hora"><option value="kg">
                  <option value="gramo"><option value="metro"><option value="cm">
                  <option value="litro"><option value="ml"><option value="granel">
                </datalist>
              </div>

              <!-- Control de stock — fila completa con toggle visual -->
              <div class="form-group pf-full pf-stock-toggle">
                <label class="pf-switch-label">
                  <input type="checkbox" name="trackStock" id="track-stock-check">
                  <span class="pf-switch-track">
                    <span class="pf-switch-thumb"></span>
                  </span>
                  <span class="pf-switch-text">Controlar stock</span>
                </label>
                <span class="form-hint">Desactivá para servicios o productos sin límite de unidades</span>
              </div>

              <!-- Stock — solo visible si trackStock está activo -->
              <div class="form-group pf-full" id="stock-field" style="display:none">
                <label class="form-label">Stock actual</label>
                <input type="number" name="stock" min="0" step="0.001"
                       value="0" style="width:100%">
                <span class="form-hint">Admite decimales para productos por peso o longitud</span>
              </div>

              <!-- Estado -->
              <div class="form-group pf-full">
                <label class="form-label">Estado</label>
                <select name="active" style="width:100%">
                  <option value="true">Activo</option>
                  <option value="false">Inactivo</option>
                </select>
              </div>

            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="product-modal-cancel">Cancelar</button>
          <button class="btn btn-primary"   id="product-modal-save">Guardar</button>
        </div>
      </div>
    </div>

    <style>
      /* Grid del formulario */
      .pf-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--space-4);
      }
      .pf-full { grid-column: 1 / -1; }

      /* Toggle switch */
      .pf-stock-toggle { border-top: 1px solid var(--color-border); padding-top: var(--space-4); }
      .pf-switch-label {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        cursor: pointer;
        user-select: none;
        width: fit-content;
      }
      .pf-switch-label input[type="checkbox"] { display: none; }
      .pf-switch-track {
        width: 40px; height: 22px;
        border-radius: 99px;
        background: var(--color-border);
        position: relative;
        flex-shrink: 0;
        transition: background 0.2s;
      }
      .pf-switch-thumb {
        position: absolute;
        top: 3px; left: 3px;
        width: 16px; height: 16px;
        border-radius: 50%;
        background: #fff;
        transition: transform 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.2);
      }
      input[type="checkbox"]:checked ~ .pf-switch-track { background: var(--color-accent); }
      input[type="checkbox"]:checked ~ .pf-switch-track .pf-switch-thumb { transform: translateX(18px); }
      /* Selector alternativo cuando el checkbox no es hermano directo del track */
      .pf-switch-label input:checked + .pf-switch-track { background: var(--color-accent); }
      .pf-switch-label input:checked + .pf-switch-track .pf-switch-thumb { transform: translateX(18px); }

      .pf-switch-text { font-size: var(--text-sm); font-weight: 500; }

      /* Tabla */
      .low-stock { color: var(--color-warning); font-weight: 600; }
      .no-stock  { color: var(--color-danger);  font-weight: 600; }

      @media (max-width: 600px) {
        .pf-grid { grid-template-columns: 1fr; }
        .pf-full { grid-column: 1; }
      }
    </style>
  `;
}
