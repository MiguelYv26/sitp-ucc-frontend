// Pequeños componentes visuales: insignia de rol, estado, etiqueta, avatar y vacío.
import { ROLES } from '../../constants/index.js';
import { esc, initials, slug } from '../../utils/format.js';

export const RoleBadge = (rol, prefix = '') => ROLES[rol] ? `<span class="badge ${ROLES[rol].css}">${prefix}${ROLES[rol].label}</span>` : '';
export const Switch = (attr, on, label) => `<label class="switch" title="${esc(label)}"><input type="checkbox" ${attr} ${on ? 'checked' : ''} aria-label="${esc(label)}"><span></span></label>`;
export const Pill = (txt) => `<span class="estado ${slug(txt)}">${esc(txt)}</span>`;
export const Tag = (txt, cls = '') => `<span class="tag ${cls}">${esc(txt)}</span>`;
export const Empty = (msg) => `<div class="empty">${esc(msg)}</div>`;
export const Avatar = (u, extra = 'sm') => `<div class="avatar ${extra} ${ROLES[u.rol]?.css || ''}">${initials(u.nombre)}</div>`;
export const Select = (name, opts, label, sel = '') => `<label>${label}<select name="${name}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
