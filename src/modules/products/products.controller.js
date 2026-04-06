/**
 * LLAMAPOS — products.controller.js
 *
 * trackStock: boolean. Cuando es false el producto es un servicio o
 * ítem sin límite — no se muestra stock, no se valida ni se descuenta.
 */
import { db }    from '../../core/db.js';
import { toast } from '../../components/toast.js';
import { renderProductsView } from './products.view.js';

let _products  = [];
let _editingId = null;

const fmt = n => '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 });

// ─── Filtrado ─────────────────────────────────────────────────
function getFiltered() {
  const search = document.getElementById('products-search')?.value.toLowerCase() || '';
  const cat    = document.getElementById('products-filter-cat')?.value || '';
  const status = document.getElementById('products-filter-status')?.value || '';
  return _products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search) ||
      (p.sku || '').toLowerCase().includes(search);
    const matchCat    = !cat    || p.category === cat;
    const matchStatus = !status ||
      (status === 'active'   &&  p.active) ||
      (status === 'inactive' && !p.active);
    return matchSearch && matchCat && matchStatus;
  });
}

// ─── Stats ────────────────────────────────────────────────────
function renderStats() {
  const el = document.getElementById('products-stats');
  if (!el) return;
  const total      = _products.length;
  const active     = _products.filter(p => p.active).length;
  const services   = _products.filter(p => !p.trackStock).length;
  // "stock bajo" solo aplica a los que tienen trackStock activo
  const lowStock   = _products.filter(p => p.trackStock && p.stock > 0 && p.stock <= 5).length;

  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__label">Total</div>
      <div class="stat-card__value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Activos</div>
      <div class="stat-card__value">${active}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Servicios</div>
      <div class="stat-card__value text-muted">${services}</div>
      <div class="stat-card__sub">sin control de stock</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Stock bajo</div>
      <div class="stat-card__value" style="color:var(--color-warning)">${lowStock}</div>
      <div class="stat-card__sub">≤ 5 unidades</div>
    </div>`;
}

// ─── Filtro de categorías ─────────────────────────────────────
function renderCategoryFilter() {
  const sel      = document.getElementById('products-filter-cat');
  const datalist = document.getElementById('cat-list');
  const cats     = [...new Set(_products.map(p => p.category).filter(Boolean))];
  if (sel)      sel.innerHTML      = `<option value="">Todas las categorías</option>` + cats.map(c => `<option value="${c}">${c}</option>`).join('');
  if (datalist) datalist.innerHTML = cats.map(c => `<option value="${c}">`).join('');
}

// ─── Tabla ────────────────────────────────────────────────────
function renderTable() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  const filtered = getFiltered();

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-state__icon">📦</div>
        <div class="empty-state__title">Sin productos</div>
        <div class="empty-state__desc">Creá tu primer producto con el botón de arriba</div>
      </div></td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    // Stock: solo mostrar si trackStock está activo
    let stockCell;
    if (!p.trackStock) {
      stockCell = `<td class="text-right text-muted text-xs">Sin control</td>`;
    } else {
      const cls = p.stock === 0 ? 'no-stock' : p.stock <= 5 ? 'low-stock' : '';
      stockCell = `<td class="text-right font-mono ${cls}">${p.stock}</td>`;
    }

    return `<tr>
      <td>
        <strong>${p.name}</strong>
        ${!p.trackStock ? `<span class="badge badge-neutral" style="margin-left:6px;font-size:10px">servicio</span>` : ''}
      </td>
      <td><span class="font-mono text-xs">${p.sku || '—'}</span></td>
      <td>${p.category || '—'}</td>
      <td class="text-right font-mono">${fmt(p.price)}${p.unit ? ` <span class="text-xs text-muted">/ ${p.unit}</span>` : ''}</td>
      ${stockCell}
      <td><span class="badge ${p.active ? 'badge-success' : 'badge-neutral'}">
        ${p.active ? 'Activo' : 'Inactivo'}</span></td>
      <td>
        <div class="flex gap-2" style="justify-content:flex-end;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" data-action="edit"   data-id="${p.id}">Editar</button>
          <button class="btn btn-ghost btn-sm"     data-action="toggle" data-id="${p.id}">
            ${p.active ? 'Desactivar' : 'Activar'}</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)"
                  data-action="delete" data-id="${p.id}">Eliminar</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleTableAction(btn.dataset.action, btn.dataset.id));
  });
}

// ─── Acciones de tabla ────────────────────────────────────────
async function handleTableAction(action, id) {
  const product = _products.find(p => p.id === id);
  if (!product) return;

  if (action === 'edit') {
    openModal(product);
  } else if (action === 'toggle') {
    await db.update('products', id, { active: !product.active });
    toast.success(`Producto ${product.active ? 'desactivado' : 'activado'}`);
    await reload();
  } else if (action === 'delete') {
    if (!confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`)) return;
    await db.delete('products', id);
    toast.success('Producto eliminado');
    await reload();
  }
}

// ─── Modal ────────────────────────────────────────────────────
function openModal(product = null) {
  _editingId = product?.id || null;

  const titleEl = document.getElementById('product-modal-title');
  const form    = document.getElementById('product-form');
  if (titleEl) titleEl.textContent = product ? 'Editar producto' : 'Nuevo producto';

  if (form) {
    form.reset();

    if (product) {
      form.name.value       = product.name       || '';
      form.sku.value        = product.sku        || '';
      form.category.value   = product.category   || '';
      form.price.value      = product.price      || '';
      form.unit.value       = product.unit       || '';
      form.active.value     = String(product.active !== false);
      // trackStock puede ser undefined en registros viejos → asumir true
      form.trackStock.checked = product.trackStock !== false;
      form.stock.value      = product.stock      ?? 0;
    } else {
      // Por defecto nuevo producto tiene stock activo
      form.trackStock.checked = false;
    }

    // Sincronizar visibilidad del campo stock
    toggleStockField(form.trackStock.checked);

    // Listener para mostrar/ocultar stock según el checkbox
    form.trackStock.addEventListener('change', () => {
      toggleStockField(form.trackStock.checked);
    });
  }

  document.getElementById('product-modal-backdrop')?.classList.add('open');
}

function toggleStockField(show) {
  const field = document.getElementById('stock-field');
  if (field) field.style.display = show ? 'block' : 'none';
}

function closeModal() {
  document.getElementById('product-modal-backdrop')?.classList.remove('open');
  _editingId = null;
}

// ─── Guardar ──────────────────────────────────────────────────
async function saveProduct() {
  const form = document.getElementById('product-form');
  if (!form) return;

  const name  = form.name.value.trim();
  const price = parseFloat(form.price.value);
  if (!name)        { toast.error('El nombre es obligatorio'); return; }
  if (isNaN(price)) { toast.error('El precio es obligatorio'); return; }

  const trackStock = form.trackStock.checked;

  const data = {
    name,
    sku:        form.sku.value.trim(),
    category:   form.category.value.trim(),
    price,
    unit:       form.unit.value.trim(),
    trackStock,
    // Si no hay control de stock, guardamos null para dejar claro que no aplica
    stock:      trackStock ? (parseFloat(form.stock.value) || 0) : null,
    active:     form.active.value === 'true',
  };

  try {
    if (_editingId) {
      await db.update('products', _editingId, data);
      toast.success('Producto actualizado');
    } else {
      await db.insert('products', data);
      toast.success('Producto creado');
    }
    closeModal();
    await reload();
  } catch (err) {
    console.error(err);
    toast.error('Error al guardar');
  }
}

// ─── Reload ───────────────────────────────────────────────────
async function reload() {
  _products = await db.getAll('products');
  renderStats();
  renderCategoryFilter();
  renderTable();
}

// ─── Entry point ──────────────────────────────────────────────
export async function renderProducts(container) {
  container.innerHTML = renderProductsView();
  _products = await db.getAll('products');
  renderStats();
  renderCategoryFilter();
  renderTable();

  document.getElementById('btn-new-product')?.addEventListener('click', () => openModal());
  document.getElementById('products-search')?.addEventListener('input', renderTable);
  document.getElementById('products-filter-cat')?.addEventListener('change', renderTable);
  document.getElementById('products-filter-status')?.addEventListener('change', renderTable);
  document.getElementById('product-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('product-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('product-modal-save')?.addEventListener('click', saveProduct);
  document.getElementById('product-modal-backdrop')?.addEventListener('click', e => {
    if (e.target === document.getElementById('product-modal-backdrop')) closeModal();
  });
}
