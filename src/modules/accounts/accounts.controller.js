 /**
 * LLAMAPOS — accounts.controller.js
 */
import { db }    from '../../core/db.js';
import { toast } from '../../components/toast.js';
import { renderAccountsView } from './accounts.view.js';

let _accounts  = [];
let _clients   = [];
let _movements = [];

const fmt = n => '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 2 });

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR') + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
}

function getClientName(clientId) {
  const c = _clients.find(c => c.id === clientId);
  return c ? c.name : clientId;
}

function getFiltered() {
  const search = document.getElementById('accounts-search')?.value.toLowerCase() || '';
  const filter = document.getElementById('accounts-filter')?.value || '';
  return _accounts.filter(a => {
    const name = getClientName(a.clientId).toLowerCase();
    const matchSearch = !search || name.includes(search);
    const matchFilter = !filter ||
      (filter === 'debt' && (a.balance || 0) > 0) ||
      (filter === 'zero' && (a.balance || 0) <= 0);
    return matchSearch && matchFilter;
  });
}

function renderStats() {
  const el = document.getElementById('accounts-stats');
  if (!el) return;
  const totalAccounts = _accounts.length;
  const totalDebt     = _accounts.reduce((s, a) => s + Math.max(a.balance || 0, 0), 0);
  const withDebt      = _accounts.filter(a => (a.balance || 0) > 0).length;
  el.innerHTML = `
    <div class="stat-card">
      <div class="stat-card__label">Cuentas activas</div>
      <div class="stat-card__value">${totalAccounts}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Con deuda</div>
      <div class="stat-card__value" style="color:var(--color-warning)">${withDebt}</div>
    </div>
    <div class="stat-card">
      <div class="stat-card__label">Deuda total</div>
      <div class="stat-card__value" style="color:var(--color-danger)">${fmt(totalDebt)}</div>
      <div class="stat-card__sub">en cuentas corrientes</div>
    </div>`;
}

function renderTable() {
  const tbody = document.getElementById('accounts-tbody');
  if (!tbody) return;
  const filtered = getFiltered();
  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">
      <div class="empty-state"><div class="empty-state__icon">📒</div>
      <div class="empty-state__desc">No hay cuentas corrientes registradas</div></div>
    </td></tr>`;
    return;
  }

  const lastMovements = {};
  _movements.forEach(m => {
    if (!lastMovements[m.accountId] || m.createdAt > lastMovements[m.accountId]) {
      lastMovements[m.accountId] = m.createdAt;
    }
  });

  tbody.innerHTML = filtered.map(a => {
    const balance      = a.balance || 0;
    const balanceClass = balance > 0 ? 'balance-positive' : 'balance-zero';
    const lastMov      = lastMovements[a.id];
    return `<tr>
      <td><strong>${getClientName(a.clientId)}</strong></td>
      <td class="text-right font-mono ${balanceClass}">${fmt(balance)}</td>
      <td class="text-right font-mono text-muted">${a.credit_limit ? fmt(a.credit_limit) : '—'}</td>
      <td class="text-sm text-muted">${fmtDate(lastMov)}</td>
      <td>
        <div class="flex gap-2" style="justify-content:flex-end">
          <button class="btn btn-secondary btn-sm" data-action="detail" data-id="${a.id}">Ver movimientos</button>
          <button class="btn btn-primary btn-sm" data-action="pay" data-id="${a.id}"
            data-client="${a.clientId}">Registrar pago</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.action === 'detail') showDetail(btn.dataset.id);
      if (btn.dataset.action === 'pay')    openPaymentModal(btn.dataset.client);
    });
  });
}

function showDetail(accountId) {
  const acc = _accounts.find(a => a.id === accountId);
  if (!acc) return;
  const detailEl = document.getElementById('account-detail');
  const titleEl  = document.getElementById('account-detail-title');
  const tbody    = document.getElementById('movements-tbody');
  if (!detailEl || !tbody) return;

  detailEl.style.display = 'block';
  detailEl.scrollIntoView({ behavior: 'smooth' });
  if (titleEl) titleEl.textContent = `Movimientos — ${getClientName(acc.clientId)}`;

  const movs = _movements.filter(m => m.accountId === accountId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (movs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4">
      <div class="empty-state"><div class="empty-state__desc">Sin movimientos</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = movs.map(m => {
    const isDebit  = m.type === 'debit';
    const cls      = isDebit ? 'movement-debit' : 'movement-credit';
    const sign     = isDebit ? '+' : '−';
    return `<tr>
      <td class="text-sm">${fmtDate(m.createdAt)}</td>
      <td><span class="badge ${isDebit ? 'badge-danger' : 'badge-success'}">
        ${isDebit ? 'Cargo' : 'Pago'}</span></td>
      <td class="text-sm">${m.description || '—'}</td>
      <td class="text-right font-mono ${cls}">${sign} ${fmt(m.amount)}</td>
    </tr>`;
  }).join('');
}

function openPaymentModal(clientId = null) {
  const form = document.getElementById('payment-form');
  if (form) form.reset();

  const clientSelect = document.getElementById('payment-client-select');
  if (clientSelect) {
    const accountClients = _accounts.map(a => a.clientId);
    clientSelect.innerHTML = `<option value="">Seleccionar cliente…</option>` +
      _clients
        .filter(c => accountClients.includes(c.id))
        .map(c => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${c.name}</option>`)
        .join('');
    clientSelect.addEventListener('change', updateBalanceInfo);
  }

  if (clientId) updateBalanceInfo();
  document.getElementById('payment-modal-backdrop')?.classList.add('open');
}

function updateBalanceInfo() {
  const clientSelect  = document.getElementById('payment-client-select');
  const balanceInfo   = document.getElementById('payment-balance-info');
  const balanceEl     = document.getElementById('payment-current-balance');
  const clientId = clientSelect?.value;
  if (!clientId) { if (balanceInfo) balanceInfo.style.display = 'none'; return; }
  const acc = _accounts.find(a => a.clientId === clientId);
  if (acc && balanceInfo && balanceEl) {
    balanceInfo.style.display = 'block';
    balanceEl.textContent = fmt(acc.balance || 0);
  }
}

function closePaymentModal() {
  document.getElementById('payment-modal-backdrop')?.classList.remove('open');
}

async function savePayment() {
  const form = document.getElementById('payment-form');
  if (!form) return;
  const clientId = form.clientId.value;
  const amount   = parseFloat(form.amount.value);
  if (!clientId) { toast.error('Seleccioná un cliente'); return; }
  if (!amount || amount <= 0) { toast.error('Ingresá un monto válido'); return; }

  try {
    const acc = _accounts.find(a => a.clientId === clientId);
    if (!acc) { toast.error('Cuenta no encontrada'); return; }
    const newBalance = Math.max((acc.balance || 0) - amount, 0);
    await db.update('accounts', acc.id, { balance: newBalance });
    await db.insert('account_movements', {
      accountId:   acc.id,
      clientId,
      type:        'credit',
      amount,
      description: form.description.value.trim() || 'Pago',
    });
    toast.success(`Pago de ${fmt(amount)} registrado`);
    closePaymentModal();
    await reload();
  } catch (err) {
    console.error(err);
    toast.error('Error al registrar el pago');
  }
}

async function reload() {
  [_accounts, _clients, _movements] = await Promise.all([
    db.getAll('accounts'),
    db.getAll('clients'),
    db.getAll('account_movements'),
  ]);
  renderStats();
  renderTable();
  document.getElementById('account-detail').style.display = 'none';
}

export async function renderAccounts(container) {
  container.innerHTML = renderAccountsView();
  [_accounts, _clients, _movements] = await Promise.all([
    db.getAll('accounts'),
    db.getAll('clients'),
    db.getAll('account_movements'),
  ]);
  renderStats();
  renderTable();

  document.getElementById('btn-new-payment')?.addEventListener('click', () => openPaymentModal());
  document.getElementById('accounts-search')?.addEventListener('input', renderTable);
  document.getElementById('accounts-filter')?.addEventListener('change', renderTable);
  document.getElementById('payment-modal-close')?.addEventListener('click', closePaymentModal);
  document.getElementById('payment-modal-cancel')?.addEventListener('click', closePaymentModal);
  document.getElementById('payment-modal-save')?.addEventListener('click', savePayment);
  document.getElementById('btn-close-detail')?.addEventListener('click', () => {
    document.getElementById('account-detail').style.display = 'none';
  });
  document.getElementById('payment-modal-backdrop')?.addEventListener('click', e => {
    if (e.target === document.getElementById('payment-modal-backdrop')) closePaymentModal();
  });
}
