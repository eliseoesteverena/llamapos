 /**
 * LLAMAPOS — clients.controller.js
 */
import { db }    from '../../core/db.js';
import { toast } from '../../components/toast.js';
import { renderClientsView } from './clients.view.js';

let _clients  = [];
let _accounts = [];
let _editingId = null;

const fmt = n => '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 });

function getFiltered() {
  const search = document.getElementById('clients-search')?.value.toLowerCase() || '';
  const status = document.getElementById('clients-filter-status')?.value || '';
  return _clients.filter(c => {
    const matchSearch = !search ||
      c.name.toLowerCase().includes(search) ||
      (c.email  || '').toLowerCase().includes(search) ||
      (c.phone  || '').includes(search);
    const matchStatus = !status ||
      (status === 'active'   &&  c.active) ||
      (status === 'inactive' && !c.active);
    return matchSearch && matchStatus;
  });
}

function getBalance(clientId) {
  const acc = _accounts.find(a => a.clientId === clientId);
  return acc ? acc.balance || 0 : 0;
}

function renderStats() {
  const el = document.getElementById('clients-stats');
  if (!el) return;
  const total    = _clients.length;
  const active   = _clients.filter(c => c.active).length;
  const withDebt = _accounts.filter(a => (a.balance || 0) > 0).length;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__label">Total clientes</div>
      <div class="stat-card__value">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Activos</div>
      <div class="stat-card__value">${active}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Con saldo deudor</div>
      <div class="stat-card__value" style="color:var(--color-warning)">${withDebt}</div>
    </div>`;
}

function renderTable() {
  const tbody = document.getElementById('clients-tbody');
  if (!tbody) return;
  const filtered = getFiltered();
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">
      <div class="empty-state"><div class="empty-state__icon">👥</div>
      <div class="empty-state__desc">No hay clientes</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(c => {
    const balance = getBalance(c.id);
    const balanceClass = balance > 0 ? 'style="color:var(--color-danger)"' : '';
    return `<tr>
      <td><strong>${c.name}</strong>${c.notes ? `<br><span class="text-xs text-muted">${c.notes}</span>` : ''}</td>
      <td>${c.email || '—'}</td>
      <td>${c.phone || '—'}</td>
      <td><span class="badge ${c.active ? 'badge-success' : 'badge-neutral'}">
        ${c.active ? 'Activo' : 'Inactivo'}</span></td>
      <td class="font-mono" ${balanceClass}>${balance !== 0 ? fmt(balance) : '—'}</td>
      <td>
        <div class="flex gap-2" style="justify-content:flex-end">
          <button class="btn btn-secondary btn-sm" data-action="edit" data-id="${c.id}">Editar</button>
          <button class="btn btn-ghost btn-sm" data-action="toggle" data-id="${c.id}">
            ${c.active ? 'Desactivar' : 'Activar'}</button>
          <button class="btn btn-ghost btn-sm" style="color:var(--color-danger)"
            data-action="delete" data-id="${c.id}">Eliminar</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleAction(btn.dataset.action, btn.dataset.id));
  });
}

async function handleAction(action, id) {
  const client = _clients.find(c => c.id === id);
  if (!client) return;
  if (action === 'edit') {
    openModal(client);
  } else if (action === 'toggle') {
    await db.update('clients', id, { active: !client.active });
    toast.success(`Cliente ${client.active ? 'desactivado' : 'activado'}`);
    await reload();
  } else if (action === 'delete') {
    if (!confirm(`¿Eliminar "${client.name}"?`)) return;
    await db.delete('clients', id);
    toast.success('Cliente eliminado');
    await reload();
  }
}

function openModal(client = null) {
  _editingId = client?.id || null;
  const title = document.getElementById('client-modal-title');
  const form  = document.getElementById('client-form');
  if (title) title.textContent = client ? 'Editar cliente' : 'Nuevo cliente';
  if (form) {
    form.reset();
    if (client) {
      form.name.value   = client.name   || '';
      form.email.value  = client.email  || '';
      form.phone.value  = client.phone  || '';
      form.notes.value  = client.notes  || '';
      form.active.value = String(client.active !== false);
    }
  }
  document.getElementById('client-modal-backdrop')?.classList.add('open');
}

function closeModal() {
  document.getElementById('client-modal-backdrop')?.classList.remove('open');
  _editingId = null;
}

async function saveClient() {
  const form = document.getElementById('client-form');
  if (!form) return;
  const name = form.name.value.trim();
  if (!name) { toast.error('El nombre es obligatorio'); return; }
  const data = {
    name,
    email:  form.email.value.trim(),
    phone:  form.phone.value.trim(),
    notes:  form.notes.value.trim(),
    active: form.active.value === 'true',
  };
  try {
    if (_editingId) {
      await db.update('clients', _editingId, data);
      toast.success('Cliente actualizado');
    } else {
      await db.insert('clients', data);
      toast.success('Cliente creado');
    }
    closeModal();
    await reload();
  } catch (err) {
    console.error(err);
    toast.error('Error al guardar');
  }
}

async function reload() {
  [_clients, _accounts] = await Promise.all([
    db.getAll('clients'),
    db.getAll('accounts'),
  ]);
  renderStats();
  renderTable();
}

export async function renderClients(container) {
  container.innerHTML = renderClientsView();
  [_clients, _accounts] = await Promise.all([
    db.getAll('clients'),
    db.getAll('accounts'),
  ]);
  renderStats();
  renderTable();

  document.getElementById('btn-new-client')?.addEventListener('click', () => openModal());
  document.getElementById('clients-search')?.addEventListener('input', renderTable);
  document.getElementById('clients-filter-status')?.addEventListener('change', renderTable);
  document.getElementById('client-modal-close')?.addEventListener('click', closeModal);
  document.getElementById('client-modal-cancel')?.addEventListener('click', closeModal);
  document.getElementById('client-modal-save')?.addEventListener('click', saveClient);
  document.getElementById('client-modal-backdrop')?.addEventListener('click', e => {
    if (e.target === document.getElementById('client-modal-backdrop')) closeModal();
  });
}
