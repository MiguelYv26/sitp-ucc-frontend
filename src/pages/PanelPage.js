// Página «Panel»: KPIs que también filtran + proyectos (tabla para el metodológico, tarjetas para técnico/jurado) + comentarios.
import { CommentItem } from '../components/comments/CommentItem.js';
import { applyFilters, bindFilters, FilterBar, projectFilters } from '../components/filters/FilterBar.js';
import { ProjectCard } from '../components/projects/ProjectCard.js';
import { Empty, Pill, RoleBadge } from '../components/ui/Badges.js';
import { ROL_PROYECTO, ROLES } from '../constants/index.js';
import { $content, refocus } from '../core/dom.js';
import { state } from '../store/state.js';
import { esc, fdate, firstName } from '../utils/format.js';
import { estadoProyecto, observado } from '../store/selectors.js';
import { bindOpen } from './shared.js';

const KPIS = [
  ['', 'Total grupos', 'teal', () => true],
  ['progreso', 'En progreso', 'green', (p) => p.estado === 'En curso'],
  ['evaluacion', 'Pendientes de evaluación', 'lime', (p) => p.estado === 'En curso' && !p.concepto],
  ['observado', 'Observados', 'gray', observado],
];
const ESTADOS = ['Al día', 'Por revisar', 'Para corrección', 'Finalizado', 'Cancelado'];
const docente = () => state.user.rol === 'docente';
const filters = () => [...projectFilters(),
  ...(docente() ? [{ key: 'miRol', label: 'Mi rol', options: ROL_PROYECTO.map((r) => [r, ROLES[r].label]), get: (p) => p.miRol }] : []),
  { key: 'estado', label: 'Estado', options: ESTADOS.map((s) => [s, s]), get: estadoProyecto }];
// Solo el estudiante filtra comentarios por autor; los docentes ven el hilo completo
const comFilters = () => state.user.rol === 'estudiante' ? [{ key: 'rol', label: 'Autor', options: Object.entries(ROLES).filter(([k]) => k !== 'docente').map(([k, v]) => [k, v.label]), get: (c) => c.autor.rol }] : [];

const Row = (p) => `<tr data-open="${p.id}" tabindex="0">
  <td data-l="Grupo"><span class="mono">G-${esc(p.grupo)}</span></td>
  <td data-l="Proyecto"><strong class="clamp">${esc(p.titulo)}</strong><small class="muted">${esc(p.programa)} · ${esc(p.estudiantesInfo.map((s) => s.nombre.split(' ')[0]).join(', '))}</small></td>
  <td data-l="Materia" class="small">${esc(p.curso)}</td>
  <td data-l="Entregables">${p.totalEntregables}${p.porRevisar ? ` <span class="dot-count">${p.porRevisar} pend.</span>` : ''}</td>
  <td data-l="Concepto" class="small">${p.concepto ? Pill(p.concepto) : '<span class="muted">Sin evaluar</span>'}</td>
  <td data-l="Fecha" class="small">${fdate(p.ultimaActividad)}</td>
  <td data-l="Estado">${Pill(estadoProyecto(p))}</td></tr>`;

const Table = (rows) => `<table class="ptable"><thead><tr><th>Grupo</th><th>Proyecto</th><th>Materia</th><th>Entregables</th><th>Concepto</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>${rows.map(Row).join('')}</tbody></table>`;

export function PanelPage() {
  const { proyectos, comentarios } = state.panel;
  const rolActual = state.rolActivo || state.user.rol;
  const f = state.filters.panel || {}, kpi = KPIS.find((k) => k[0] === (f.kpi || '')) || KPIS[0];
  const rows = applyFilters('panel', filters(), proyectos).filter(kpi[3]);
  const coms = applyFilters('com', comFilters(), comentarios);
  // Tabla si el rol actual es metodológico o administrador; tarjetas para técnico y jurado
  const tabla = rolActual === 'administrador' || rolActual === 'asesor_metodologico' || f.miRol === 'asesor_metodologico' || (!f.miRol && rows.length && rows.every((p) => p.miRol === 'asesor_metodologico'));
  const roles = docente() ? [...new Set(proyectos.map((p) => p.miRol))] : [];

  $content().innerHTML = `
    <header class="page-head"><div><h1>Hola, ${esc(firstName(state.user.nombre))}</h1>
      <p class="muted">${ROLES[rolActual]?.label || ROLES[state.user.rol]?.label}${roles.length ? ' · En tus proyectos actúas como ' + roles.map((r) => RoleBadge(r)).join(' ') : ''}</p></div></header>
    <section class="kpis" role="tablist" aria-label="Filtrar por indicador">${KPIS.map(([k, l, c, fn]) => `
      <button class="kpi ${c} ${kpi[0] === k ? 'on' : ''}" data-kpi="${k}" role="tab" aria-selected="${kpi[0] === k}"><span>${l}</span><strong>${proyectos.filter(fn).length}</strong></button>`).join('')}</section>
    <div class="panel-grid ${tabla ? 'wide' : ''}">
      <section class="card flush">
        <div class="card-head"><h2>Proyectos</h2><span class="muted small">${rows.length} de ${proyectos.length}</span></div>
        ${FilterBar('panel', filters())}
        ${!rows.length ? Empty('Ningún proyecto coincide con los filtros.') : tabla ? Table(rows) : `<div class="pgrid">${rows.map(ProjectCard).join('')}</div>`}
      </section>
      <section class="card flush">
        <div class="card-head"><h2>Comentarios recientes</h2></div>
        ${comFilters().length ? FilterBar('com', comFilters()) : ''}
        <div class="pad">${coms.length ? coms.map((c) => CommentItem(c, true)).join('') : Empty('Sin comentarios recientes.')}</div>
      </section>
    </div>`;

  const root = $content();
  root.querySelectorAll('[data-kpi]').forEach((b) => b.addEventListener('click', () => { state.filters.panel = { ...state.filters.panel, kpi: b.dataset.kpi }; PanelPage(); }));
  bindOpen(root);
  bindFilters(root, (fromSearch) => { PanelPage(); if (fromSearch) refocus(root); });
}
