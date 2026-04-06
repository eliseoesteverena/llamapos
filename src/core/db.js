/**
 * LLAMAPOS — db.js
 * Capa de abstracción de datos.
 *
 * Por qué existe esta capa:
 * Ningún módulo habla con localStorage directamente. Todos hablan con db.js.
 * Cuando migremos a un backend real, solo reemplazamos este archivo.
 * El resto del código no cambia.
 *
 * Arquitectura:
 * - _cache: objeto en memoria (rápido, volátil)
 * - localStorage: persistencia entre sesiones
 * - Las operaciones siempre actualizan ambas capas.
 */

const DB_PREFIX = 'llamapos_';

// Cache dinámico: acepta cualquier nombre de colección sin necesidad
// de declararlo de antemano. Esto corrige el crash con 'account_movements'
// y cualquier colección futura.
const _cache = {};

// ─── Utilidades internas ──────────────────────────────────────
function _key(collection) {
  return `${DB_PREFIX}${collection}`;
}

function _load(collection) {
  // hasOwnProperty para distinguir entre "no cargado aún" (undefined) y "cargado vacío" ([])
  if (Object.prototype.hasOwnProperty.call(_cache, collection)) return _cache[collection];
  const raw = localStorage.getItem(_key(collection));
  _cache[collection] = raw ? JSON.parse(raw) : [];
  return _cache[collection];
}

function _save(collection, data) {
  _cache[collection] = data;
  localStorage.setItem(_key(collection), JSON.stringify(data));
}

function _generateId() {
  // ID único basado en timestamp + random. No necesita UUID para este scope.
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── API Genérica CRUD ────────────────────────────────────────
// Esta es la interfaz real. Cada método devuelve una Promise
// para que el código que la use sea idéntico al que usaría fetch().
// Cuando migremos al backend, solo reemplazamos el cuerpo de estas funciones.

export const db = {

  /**
   * Obtiene todos los registros de una colección.
   * @param {string} collection — 'products' | 'clients' | 'sales' | 'accounts'
   * @returns {Promise<Array>}
   */
  getAll(collection) {
    return Promise.resolve([..._load(collection)]);
  },

  /**
   * Obtiene un registro por su ID.
   * @returns {Promise<Object|null>}
   */
  getById(collection, id) {
    const data = _load(collection);
    return Promise.resolve(data.find(r => r.id === id) || null);
  },

  /**
   * Inserta un nuevo registro. Genera ID y timestamps automáticamente.
   * @param {string} collection
   * @param {Object} record — los datos sin id/createdAt
   * @returns {Promise<Object>} el registro creado
   */
  insert(collection, record) {
    const data = _load(collection);
    const newRecord = {
      ...record,
      id: _generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.push(newRecord);
    _save(collection, data);
    return Promise.resolve({ ...newRecord });
  },

  /**
   * Actualiza un registro existente por ID.
   * @returns {Promise<Object|null>} el registro actualizado o null si no existe
   */
  update(collection, id, changes) {
    const data = _load(collection);
    const index = data.findIndex(r => r.id === id);
    if (index === -1) return Promise.resolve(null);
    data[index] = { ...data[index], ...changes, updatedAt: new Date().toISOString() };
    _save(collection, data);
    return Promise.resolve({ ...data[index] });
  },

  /**
   * Elimina un registro por ID.
   * @returns {Promise<boolean>}
   */
  delete(collection, id) {
    const data = _load(collection);
    const filtered = data.filter(r => r.id !== id);
    if (filtered.length === data.length) return Promise.resolve(false);
    _save(collection, filtered);
    return Promise.resolve(true);
  },

  /**
   * Busca registros que cumplan un predicado.
   * @param {Function} predicate — función que recibe un record y devuelve boolean
   * @returns {Promise<Array>}
   */
  query(collection, predicate) {
    const data = _load(collection);
    return Promise.resolve(data.filter(predicate));
  },

  /**
   * Invalida el cache en memoria para una colección.
   * Útil si se modificó localStorage externamente.
   */
  invalidate(collection) {
    _cache[collection] = null;
  },

  /**
   * Seed: carga datos iniciales si la colección está vacía.
   * Solo se ejecuta una vez.
   */
  async seed(collection, records) {
    const existing = await this.getAll(collection);
    if (existing.length > 0) return;
    for (const record of records) {
      await this.insert(collection, record);
    }
  },
};

// seedInitialData se mantiene como función vacía para no romper el import en app.js.
// No hay datos de ejemplo: la app arranca limpia.
export async function seedInitialData() {}
