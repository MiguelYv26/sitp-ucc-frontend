// <FilterBar/>: un solo componente de filtros para todas las listas.
// defs: [{ key, label, options: [[valor, texto]], get: (item) => valor, match? }] ; key 'q' = búsqueda de texto
import { materias, state } from '../../store/state.js';
import { esc } from '../../utils/format.js';
import { Icon } from '../ui/Icon.js';

export function FilterBar(scope, defs) {
  const f = state.filters[scope] || {};
  return `<div class="filters" data-scope="${scope}">${defs.map((d) => d.key === 'q'
    ? `<label class="search">${Icon('search')}<input data-f="q" value="${esc(f.q || '')}" placeholder="${esc(d.label)}" aria-label="${esc(d.label)}">${f.q ? `<button type="button" class="x" data-x title="Borrar búsqueda" aria-label="Borrar búsqueda">${Icon('x')}</button>` : ''}</label>`
    : `<select data-f="${d.key}" aria-label="${esc(d.label)}"><option value="">${esc(d.label)}: todos</option>${d.options.map(([v, t]) => `<option value="${esc(v)}" ${String(f[d.key] ?? '') === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`).join('')}
</div>`;
}

export function applyFilters(scope, defs, items) {
  const f = state.filters[scope] || {};
  return items.filter((it) => defs.every((d) => {
    const v = f[d.key];
    if (!v) return true;
    if (d.key === 'q') return d.get(it).toLowerCase().includes(v.toLowerCase());
    if (d.match) return d.match(it, v);
    return String(d.get(it)) === String(v);
  }));
}

export function bindFilters(root, rerender) {
  root.querySelectorAll('.filters').forEach((bar) => {
    const scope = bar.dataset.scope;
    const set = (k, v) => { state.filters[scope] = { ...state.filters[scope], [k]: v }; rerender(k === 'q'); };
    bar.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => set(s.dataset.f, s.value)));
    bar.querySelectorAll('input[data-f]').forEach((i) => i.addEventListener('input', () => set('q', i.value)));
    bar.querySelector('[data-x]')?.addEventListener('click', () => set('q', ''));
  });
}

export const materiaFilter = (get) => ({ key: 'materia', label: 'Materia', options: Object.entries(materias()), get });
export const projectFilters = () => [
  { key: 'q', label: 'Buscar proyecto, grupo o estudiante', get: (p) => `${p.titulo} ${p.grupo} ${p.estudiantesInfo.map((s) => s.nombre).join(' ')}` },
  materiaFilter((p) => p.cursoActual),
  { key: 'programa', label: 'Programa', options: (state.panel?.programas || []).map((n) => [n, n]), get: (p) => p.programa },
];
