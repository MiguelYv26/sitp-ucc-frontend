// Cliente de la API REST (capa de acceso a datos del frontend).
const local = new Set(['localhost', '127.0.0.1', '[::1]']);
const raw = window.__API_BASE__ || '';
const unresolved = raw.startsWith('__PORT_');
if (unresolved && !local.has(location.hostname)) throw new Error('El proxy del backend no fue configurado');
const BASE = unresolved ? (location.port === '8000' ? '' : 'http://localhost:8000') : raw;

let token = null; // el token vive en memoria durante la sesión

export const hasToken = () => Boolean(token);
export function setToken(t) {
  token = t;
}

async function request(method, path, body, asBlob = false) {
  const form = body instanceof FormData; // los PDF viajan como multipart
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(form || !body ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  if (res.ok && asBlob) return res.blob();
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const err = new Error(data.error || 'Error de conexión'); err.status = res.status; throw err; }
  return data;
}

export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),
  logout: () => request('POST', '/auth/logout'),
  panel: () => request('GET', '/panel'),
  proyecto: (id) => request('GET', `/proyectos/${id}`),
  objetivo: (id, b) => request('POST', `/proyectos/${id}/objetivos`, b),
  acta: (id, b) => request('POST', `/proyectos/${id}/actas`, b),
  entregable: (id, b) => request('POST', `/proyectos/${id}/entregables`, b),
  comentario: (id, b) => request('POST', `/proyectos/${id}/comentarios`, b),
  avanzar: (id) => request('POST', `/proyectos/${id}/avanzar`),
  revision: (id, b) => request('POST', `/entregables/${id}/revisiones`, b),
  editar: (id, b) => request('PATCH', `/proyectos/${id}`, b),
  cancelar: (id, b) => request('POST', `/proyectos/${id}/cancelar`, b),
  file: (path) => request('GET', path, null, true),
};
