/**
 * LLAMAPOS — accounts.view.js
 */
export function renderAccountsView() {
  return `
    <div class="page-header flex-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Cuentas Corrientes</h1>
        <p class="text-muted text-sm mt-1">Control de saldos y movimientos por cliente</p>
      </div>
      <button id="btn-new-payment" class="btn btn-primary">+ Registrar pago</button>
    </div>

    <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;margin-bottom:var(--space-4)">
      <div class="search-bar" style="flex:1; min-width:200px">
        <span class="search-bar__icon">⌕</span>
        <input type="text" id="accounts-search" placeholder="Buscar cliente…">
      </div>
      <select id="accounts-filter" style="min-width:160px">
        <option value="">Todos los saldos</option>
        <option value="debt">Con deuda</option>
        <option value="zero">Sin deuda</option>
      </select>
    </div>

    <!-- Resumen total -->
    <div class="grid grid-3 mb-6" id="accounts-stats"></div>

    <!-- Tabla de cuentas -->
    <div class="card" style="padding:0;overflow:hidden;margin-bottom:var(--space-6)">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Cliente</th>
              <th class="text-right">Saldo deudor</th>
              <th class="text-right">Límite crédito</th>
              <th>Último movimiento</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="accounts-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Detalle de movimientos (se muestra al seleccionar una cuenta) -->
    <div id="account-detail" style="display:none">
      <div class="flex-between mb-4">
        <h2 class="text-xl font-bold" id="account-detail-title">Movimientos</h2>
        <button class="btn btn-ghost btn-sm" id="btn-close-detail">✕ Cerrar</button>
      </div>
      <div class="card" style="padding:0;overflow:hidden">
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Descripción</th>
                <th class="text-right">Monto</th>
              </tr>
            </thead>
            <tbody id="movements-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal pago -->
    <div id="payment-modal-backdrop" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title">Registrar pago</span>
          <button class="btn btn-ghost" id="payment-modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="payment-form" novalidate>
            <div class="form-group">
              <label class="form-label">Cliente *</label>
              <select name="clientId" id="payment-client-select">
                <option value="">Seleccionar cliente…</option>
              </select>
            </div>
            <div class="form-group" id="payment-balance-info" style="display:none">
              <label class="form-label">Saldo actual</label>
              <div id="payment-current-balance" class="font-mono font-bold"
                   style="color:var(--color-danger); font-size:var(--text-xl)"></div>
            </div>
            <div class="form-group">
              <label class="form-label">Monto *</label>
              <input type="number" name="amount" min="0.01" step="0.01" placeholder="0.00">
            </div>
            <div class="form-group">
              <label class="form-label">Descripción</label>
              <input type="text" name="description" placeholder="Ej: Pago en efectivo">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="payment-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="payment-modal-save">Registrar pago</button>
        </div>
      </div>
    </div>

    <style>
      .balance-positive { color: var(--color-danger); }
      .balance-zero     { color: var(--color-muted); }
      .movement-debit   { color: var(--color-danger); }
      .movement-credit  { color: var(--color-success); }
    </style>
  `;
}
