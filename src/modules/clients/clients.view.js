/**
 * LLAMAPOS — clients.view.js
 */
export function renderClientsView() {
  return `
    <div class="page-header flex-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">Clientes</h1>
        <p class="text-muted text-sm mt-1">Administrá tu cartera de clientes</p>
      </div>
      <button id="btn-new-client" class="btn btn-primary">+ Nuevo cliente</button>
    </div>

    <div style="display:flex;gap:var(--space-3);flex-wrap:wrap;align-items:center;margin-bottom:var(--space-4)">
      <div class="search-bar" style="flex:1; min-width:200px">
        <span class="search-bar__icon">⌕</span>
        <input type="text" id="clients-search" placeholder="Buscar por nombre, email o teléfono…">
      </div>
      <select id="clients-filter-status" style="min-width:120px">
        <option value="">Todos</option>
        <option value="active">Activos</option>
        <option value="inactive">Inactivos</option>
      </select>
    </div>

    <div class="grid grid-3 mb-6" id="clients-stats"></div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Estado</th>
              <th>Saldo cuenta</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="clients-tbody"></tbody>
        </table>
      </div>
    </div>

    <!-- Modal -->
    <div id="client-modal-backdrop" class="modal-backdrop">
      <div class="modal">
        <div class="modal-header">
          <span class="modal-title" id="client-modal-title">Nuevo cliente</span>
          <button class="btn btn-ghost" id="client-modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form id="client-form" novalidate>
            <div class="form-group">
              <label class="form-label">Nombre *</label>
              <input type="text" name="name" required placeholder="Nombre completo">
            </div>
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" name="email" placeholder="correo@ejemplo.com">
            </div>
            <div class="form-group">
              <label class="form-label">Teléfono</label>
              <input type="tel" name="phone" placeholder="11 1234-5678">
            </div>
            <div class="form-group">
              <label class="form-label">Notas</label>
              <textarea name="notes" rows="2" placeholder="Observaciones…"
                style="resize:vertical; width:100%"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Estado</label>
              <select name="active">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="client-modal-cancel">Cancelar</button>
          <button class="btn btn-primary" id="client-modal-save">Guardar</button>
        </div>
      </div>
    </div>
  `;
}
