// Página «Proyectos»: los proyectos abiertos agrupados por grupo (desplegables).
import { applyFilters, bindFilters, FilterBar, projectFilters } from '../components/filters/FilterBar.js';
import { ProjectCard } from '../components/projects/ProjectCard.js';
import { Empty } from '../components/ui/Badges.js';
import { $content, refocus } from '../core/dom.js';
import { state } from '../store/state.js';
import { esc } from '../utils/format.js';
import { bindOpen } from './shared.js';

const Group = (g, ps, open) => `<details class="group" data-group="${esc(g)}" ${open ? 'open' : ''}>
  <summary><strong>Proyectos - Grupo ${esc(g)}</strong><span class="muted small">${ps.length} proyecto(s)</span></summary>
  ${ps.map(ProjectCard).join('')}
</details>`;

export function ProyectosPage() {
  const open = state.panel.proyectos.filter((p) => p.estado === 'En curso');
  const rows = applyFilters('proyectos', projectFilters(), open);
  const groups = [...new Set(rows.map((p) => p.grupo))].sort();
  const searching = Object.values(state.filters.proyectos || {}).some(Boolean);
  $content().innerHTML = `
    <header class="page-head"><div><h1>Proyectos</h1><p class="muted">${open.length} proyecto(s) abierto(s) en ${new Set(open.map((p) => p.grupo)).size} grupo(s)</p></div></header>
    <section class="card flush">${FilterBar('proyectos', projectFilters())}
      <div class="pad">${groups.length ? groups.map((g) => Group(g, rows.filter((p) => p.grupo === g), searching || state.openGroups.has(g))).join('') : Empty('No hay proyectos abiertos para este filtro.')}</div>
    </section>`;
  const root = $content();
  root.querySelectorAll('details.group').forEach((d) => d.addEventListener('toggle', () => { state.openGroups[d.open ? 'add' : 'delete'](d.dataset.group); }));
  bindOpen(root);
  bindFilters(root, (fromSearch) => { ProyectosPage(); if (fromSearch) refocus(root); });
}
