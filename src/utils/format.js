// Funciones puras de formato (sin efectos secundarios).
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const fdate = (d) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
export const ftime = (d) => new Date(d).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
const sinTitulo = (n) => n.replace(/^(Ing\.|Mg\.|Dr\.|Dra\.)\s*/, '');
export const firstName = (n) => sinTitulo(n).split(' ')[0];
export const initials = (n) => sinTitulo(n).split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
export const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
export const pad = (n) => String(n).padStart(2, '0');
export const fileName = (rel) => (rel || '').split('/').pop();
export const num = (v) => (v === '' || v == null ? null : Number(v));
