// Página «Proyecto»: encabezado con la materia actual + pestañas.
import { applyFilters, bindFilters, FilterBar } from '../../components/filters/FilterBar.js';
import { Empty, Pill, RoleBadge, Tag } from '../../components/ui/Badges.js';
import { confirmDialog } from '../../components/ui/ConfirmDialog.js';
import { Icon } from '../../components/ui/Icon.js';
import { bindPdfLinks } from '../../components/ui/PdfLink.js';
import { toast } from '../../components/ui/Toast.js';
import { $content, refocus } from '../../core/dom.js';
import { navigate } from '../../core/router.js';
import { api } from '../../services/api.js';
import { is, state } from '../../store/state.js';
import { esc, num } from '../../utils/format.js';
import { abierto } from '../../store/selectors.js';
import { TABS } from './tabs/index.js';

function Header(p) {
  const ps = state.panel?.proyectos || [], finished = p.estado === 'Finalizado', u = state.user.rol;
  const back = { docente: '← Proyectos', administrador: '← Administración' }[u];
  return `<header class="proj-head">
      <div class="ph-top">${back ? `<button class="link light" data-back>${back}</button>` : ''}${Tag(`${p.programa} · Grupo ${p.grupo}`, 'light')}${Pill(p.estado)}${RoleBadge(p.miRol, 'Tu rol: ')}
        ${ps.length > 1 ? `<select id="projSel" aria-label="Cambiar de proyecto">${ps.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>G-${esc(x.grupo)} · ${esc(x.titulo)}</option>`).join('')}</select>` : ''}</div>
      <h1>${esc(p.titulo)}</h1>
      <ol class="course-track" aria-label="Etapas del proyecto">${[1, 2, 3].map((n) => { const st = n < p.cursoActual || finished ? 'done' : n === p.cursoActual ? 'now' : '';
        return `<li class="ct ${st}" ${st === 'now' ? 'aria-current="step"' : ''}><span>${st === 'done' ? '✓' : n}</span><small>${esc(p.cursos[n])}<em>${st === 'done' ? 'Completada' : st ? 'En curso' : 'Pendiente'}</em></small></li>`; }).join('')}</ol>
      ${is('asesor_metodologico') && abierto(p) ? `<div class="team"><button class="btn lime" id="avanzar">${p.cursoActual < 3 ? 'Avanzar a ' + esc(p.cursos[p.cursoActual + 1]) : 'Finalizar proyecto'}</button></div>` : ''}
    </header>`;
}

export function ProyectoPage() {
  const p = state.project;
  const tabs = Object.entries(TABS).filter(([, t]) => !t.visible || t.visible(p));
  if (!tabs.some(([k]) => k === state.tab)) state.tab = 'info';
  $content().innerHTML = `${Header(p)}
    <nav class="tabs" role="tablist">${tabs.map(([k, t]) => `<button role="tab" aria-selected="${state.tab === k}" class="${state.tab === k ? 'active' : ''}" data-tab="${k}">${t.label}<span>${t.items(p).length}</span></button>`).join('')}</nav>
    <section class="card flush" id="tabBody"></section>`;

  const root = $content();
  root.querySelector('[data-back]')?.addEventListener('click', () => navigate(state.user.rol === 'administrador' ? 'admin' : 'proyectos'));
  document.getElementById('projSel')?.addEventListener('change', (e) => navigate('proyecto', { projectId: Number(e.target.value), openForm: null }));
  root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; state.openForm = null; ProyectoPage(); }));
  document.getElementById('avanzar')?.addEventListener('click', async () => {
    const next = p.cursoActual < 3;
    const ok = await confirmDialog(next ? 'Avanzar de materia' : 'Finalizar proyecto',
      next ? `El proyecto pasará a "${p.cursos[p.cursoActual + 1]}". Objetivos, actas, entregables y comentarios se conservan, así que no hay que volver a pedir el anteproyecto.` : 'El proyecto quedará marcado como finalizado.');
    if (!ok) return;
    try { await api.avanzar(p.id); toast('Materia actualizada'); state.panel = null; navigate('proyecto', { tab: 'info' }); } catch (e) { toast(e.message, true); }
  });
  TabBody();
}

const reload = async () => { state.openForm = null; state.project = await api.proyecto(state.project.id); state.panel = null; ProyectoPage(); };

function TabBody() {
  const p = state.project, t = TABS[state.tab], body = document.getElementById('tabBody');
  if (t.mount) return t.mount(body, p, { reload }); // pestañas con vista propia (Evaluación)
  const defs = t.filters(p), scope = state.tab;
  const items = applyFilters(scope, defs, t.items(p));
  const c = t.create(p) || null;
  const open = c && (c.fixed || state.openForm === state.tab);
  body.innerHTML = `${t.intro ? t.intro(p) : ''}
    <div class="card-head">${FilterBar(scope, defs)}${c && !open ? `<button class="btn sm" data-new>${Icon('plus')}${c.label}</button>` : ''}</div>
    ${open ? `<form class="form compose" data-form="${c.kind}">${c.html}<div class="row-end">${c.fixed ? '' : '<button type="button" class="btn ghost" data-cancel>Cancelar</button>'}<button class="btn">${c.fixed ? c.label : 'Guardar'}</button></div></form>` : ''}
    <div class="pad">${items.length ? t.list(items, p) : Empty('No hay registros para este filtro.')}</div>`;

  body.querySelector('[data-new]')?.addEventListener('click', () => { state.openForm = state.tab; TabBody(); body.querySelector('.compose select, .compose textarea, .compose input')?.focus(); });
  body.querySelector('[data-cancel]')?.addEventListener('click', () => { state.openForm = null; TabBody(); });
  body.querySelectorAll('[data-tab-go]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tabGo; ProyectoPage(); }));
  body.querySelectorAll('[data-add-row]').forEach((b) => b.addEventListener('click', () => { // agrega otra fila (ej.: compromisos)
    const box = body.querySelector(b.dataset.addRow), fila = box.lastElementChild.cloneNode(true);
    fila.querySelectorAll('input').forEach((i) => { i.value = ''; }); box.append(fila); fila.querySelector('input').focus();
  }));
  t.bind?.(body, p, { reload });
  body.querySelectorAll('[data-ref]').forEach((b) => b.addEventListener('click', () => { state.filters.historial = { ref: b.dataset.ref }; state.tab = 'historial'; ProyectoPage(); }));
  bindPdfLinks(body);
  body.querySelector('[data-edit]')?.addEventListener('click', () => projectAction('editar', 'Editar información', 'Cada cambio queda registrado en el historial.',
    `<label>Título<input name="titulo" required maxlength="255" value="${esc(p.titulo)}"></label>${is('asesor_metodologico') ? `<label>Grupo<input name="grupo" maxlength="10" value="${esc(p.grupo)}"></label>` : ''}`, 'Información actualizada'));
  body.querySelector('[data-cancel-proj]')?.addEventListener('click', () => projectAction('cancelar', 'Cancelar proyecto', 'El proyecto quedará cancelado y ya no admitirá cambios. El historial se conserva.',
    '<label>Motivo<textarea name="motivo" rows="2" required minlength="5"></textarea></label>', 'Proyecto cancelado'));
  bindFilters(body, (fromSearch) => { TabBody(); if (fromSearch) refocus(body); });
  bindForms(body);
}

async function projectAction(kind, title, text, fields, msg) {
  const d = await confirmDialog(title, text, fields);
  if (!d) return;
  try { await api[kind](state.project.id, d); toast(msg); state.panel = null; navigate('proyecto'); } catch (e) { toast(e.message, true); }
}

// Convierte los valores del formulario al tipo que espera la API (Flask)
function toPayload(kind, f) {
  if (kind === 'entregable') return new FormData(f); // PDF en multipart
  const d = Object.fromEntries(new FormData(f));
  if (kind === 'comentario') { const [sobre, id] = d.ref.split(':'); return { sobre, sobreId: num(id), texto: d.texto }; }
  if (kind === 'objetivo') return { ...d, objetivoId: num(d.objetivoId) };
  if (kind === 'acta') {
    const fd = new FormData(f), col = (k) => fd.getAll(k);
    const compromisos = col('c_desc').map((descripcion, i) => ({ descripcion, responsable: col('c_resp')[i], fecha_limite: col('c_fecha')[i] }));
    return { temas: d.temas, fecha: d.fecha || null, compromisos };
  }
  return d;
}

function bindForms(root) {
  const p = state.project;
  const MSG = { objetivo: 'Versión del objetivo guardada', entregable: 'PDF subido y renombrado', acta: 'Acta registrada', comentario: 'Comentario publicado' };
  const submit = (f, call, msg) => f.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const btn = f.querySelector('button:not([type=button])');
    btn.disabled = true;
    try { await call(); toast(msg); await reload(); } catch (e) { toast(e.message, true); btn.disabled = false; }
  });
  root.querySelectorAll('[data-form]').forEach((f) => { const kind = f.dataset.form; submit(f, () => api[kind](p.id, toPayload(kind, f)), MSG[kind]); });
  root.querySelectorAll('[data-review]').forEach((f) => submit(f, () => {
    const d = Object.fromEntries(new FormData(f));
    return api.revision(f.dataset.review, { ...d, actaId: num(d.actaId), nota: num(d.nota) });
  }, 'Revisión registrada'));
}
