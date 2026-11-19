// SPA en JavaScript vanilla: Panel, Proyectos (por grupo) y Proyecto, con filtros en lugar de vistas repetidas.
import { api, setToken, hasToken } from './api.js';

const $app = document.getElementById('app');
const state = { user: null, view: 'panel', projectId: null, tab: 'info', openGroups: new Set(), panel: null, project: null, filters: {}, openForm: null };

const ROLES = {
  estudiante: { label: 'Estudiante', css: 'est' },
  asesor_tecnico: { label: 'Asesor técnico', css: 'tec' },
  asesor_metodologico: { label: 'Asesor metodológico', css: 'met' },
};
const ESTADOS_ENT = ['Entregado', 'Revisado', 'Para corrección', 'Aprobado'];
const REVISOR = { tecnica: 'asesor_tecnico', metodologica: 'asesor_metodologico' };
const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  folder: 'M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
  out: 'M15 12H4m11 0l-4-4m4 4l-4 4M14 4h5a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-5',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16l-4-4',
  x: 'M6 6l12 12M18 6L6 18',
  file: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5',
};

/* ---------- Utilidades ---------- */
const icon = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[n]}"/></svg>`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fdate = (d) => new Date(d.length === 10 ? d + 'T12:00:00' : d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
const firstName = (n) => n.replace(/^(Ing\.|Mg\.|Dr\.|Dra\.)\s*/, '').split(' ')[0];
const initials = (n) => n.replace(/^(Ing\.|Mg\.|Dr\.|Dra\.)\s*/, '').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const slug = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
const roleBadge = (rol) => `<span class="badge ${ROLES[rol].css}">${ROLES[rol].label}</span>`;
const pill = (txt) => `<span class="estado ${slug(txt)}">${esc(txt)}</span>`;
const tag = (txt, cls = '') => `<span class="tag ${cls}">${esc(txt)}</span>`;
const is = (...r) => r.includes(state.user.rol);
const pad = (n) => String(n).padStart(2, '0');
const empty = (msg) => `<div class="empty">${esc(msg)}</div>`;

function toast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `show ${error ? 'error' : ''}`;
  clearTimeout(t._t); t._t = setTimeout(() => (t.className = ''), 3000);
}
// Diálogo único: confirma (sin campos) o devuelve los datos de un formulario corto (con campos)
function confirmDialog(title, text, fields = '') {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'modal-bg';
    d.innerHTML = `<form class="modal form" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(text)}</p>${fields}
      <div class="row-end"><button type="button" class="btn ghost" data-r="0">Cancelar</button><button class="btn">Confirmar</button></div></form>`;
    const f = d.querySelector('form');
    f.addEventListener('submit', (e) => { e.preventDefault(); d.remove(); resolve(fields ? Object.fromEntries(new FormData(f)) : true); });
    d.querySelector('[data-r]').addEventListener('click', () => { d.remove(); resolve(null); });
    document.body.append(d);
    f.querySelector('input, textarea')?.focus();
  });
}
// Abre un PDF protegido: se pide con el token y se muestra en otra pestaña (o se descarga)
async function openPdf(path, name) {
  const w = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await api.file(path));
    if (w) w.location.href = url; else Object.assign(document.createElement('a'), { href: url, download: name }).click();
  } catch (e) { w?.close(); toast(e.message, true); }
}

/* ---------- Filtros genéricos (un solo componente para todas las listas) ---------- */
// def: [{ key, label, options: [[valor, texto]], get: (item) => valor }] ; key 'q' = búsqueda de texto
function filterBar(scope, defs) {
  const f = state.filters[scope] || {};
  return `<div class="filters" data-scope="${scope}">${defs.map((d) => d.key === 'q'
    ? `<label class="search">${icon('search')}<input data-f="q" value="${esc(f.q || '')}" placeholder="${esc(d.label)}" aria-label="${esc(d.label)}">${f.q ? `<button type="button" class="x" data-x title="Borrar búsqueda" aria-label="Borrar búsqueda">${icon('x')}</button>` : ''}</label>`
    : `<select data-f="${d.key}" aria-label="${esc(d.label)}"><option value="">${esc(d.label)}: todos</option>${d.options.map(([v, t]) => `<option value="${esc(v)}" ${String(f[d.key] ?? '') === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select>`).join('')}
</div>`;
}
function applyFilters(scope, defs, items) {
  const f = state.filters[scope] || {};
  return items.filter((it) => defs.every((d) => {
    const v = f[d.key];
    if (!v) return true;
    if (d.key === 'q') return d.get(it).toLowerCase().includes(v.toLowerCase());
    if (d.match) return d.match(it, v);
    return String(d.get(it)) === String(v);
  }));
}
function bindFilters(root, rerender) {
  root.querySelectorAll('.filters').forEach((bar) => {
    const scope = bar.dataset.scope;
    const set = (k, v) => { state.filters[scope] = { ...state.filters[scope], [k]: v }; rerender(k === 'q'); };
    bar.querySelectorAll('select[data-f]').forEach((s) => s.addEventListener('change', () => set(s.dataset.f, s.value)));
    bar.querySelectorAll('input[data-f]').forEach((i) => i.addEventListener('input', () => set('q', i.value)));
    bar.querySelector('[data-x]')?.addEventListener('click', () => set('q', ''));
  });
}
// Materias: nombres reales que llegan de la base de datos (tabla materias)
const materias = () => state.project?.cursos || state.panel?.cursos || {};
const mat = (n) => materias()[n] || '';
const materiaOpts = () => Object.entries(materias());
const materiaFilter = (get) => ({ key: 'materia', label: 'Materia', options: materiaOpts(), get });

/* ---------- Login ---------- */
function renderLogin() {
  $app.innerHTML = `
  <main class="login">
    <section class="login-brand">
      <img src="img/logo-ucc.png" alt="Universidad Cooperativa de Colombia" class="logo-card">
      <div>
        <p class="eyebrow">Sede Medellín · Ingeniería de Software y Civil</p>
        <h1>Sistema de Trazabilidad de Proyectos de Investigación Formativa</h1>
        <p class="lead">Historial continuo de cada proyecto en los tres cursos, con objetivos, actas, entregables y comentarios compartidos entre el asesor técnico y el asesor metodológico.</p>
      </div>
      <ol class="cursos-list">
        <li><span>1</span>Ideación, Emprendimiento y Desarrollo Tecnológico</li>
        <li><span>2</span>Construcción del Trabajo de Grado</li>
        <li><span>3</span>Aplicación Práctica del Trabajo de Grado</li>
      </ol>
    </section>
    <section class="login-form-wrap">
      <form class="login-form" id="loginForm" novalidate>
        <h2>Bienvenido</h2>
        <p class="muted">Ingresa con tu correo institucional. El rol se detecta automáticamente.</p>
        <label>Correo institucional<input type="email" name="email" autocomplete="username" placeholder="usuario@campusucc.edu.co" required></label>
        <label>Contraseña<input type="password" name="password" autocomplete="current-password" placeholder="••••••••" required></label>
        <p class="form-error" id="loginError" hidden></p>
        <button class="btn block" type="submit">Iniciar sesión</button>
        <p class="fine">Prototipo en entorno de prueba con datos ficticios · Formato E8 · Grupo 04</p>
      </form>
    </section>
  </main>`;
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target), err = document.getElementById('loginError'), btn = e.target.querySelector('button');
    err.hidden = true; btn.disabled = true; btn.textContent = 'Verificando…';
    try {
      const { token, user } = await api.login(f.get('email'), f.get('password'));
      setToken(token); Object.assign(state, { user, view: 'panel', filters: {}, projectId: null });
      go('panel');
    } catch (ex) { err.textContent = ex.message; err.hidden = false; btn.disabled = false; btn.textContent = 'Iniciar sesión'; }
  });
}

/* ---------- Estructura ---------- */
function shell(content) {
  const u = state.user;
  const nav = [['panel', 'Panel', 'home'], ['proyectos', 'Proyectos', 'folder']];
  const active = state.view === 'proyecto' ? 'proyectos' : state.view;
  $app.innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="side-brand"><img src="img/logo-ucc.png" alt="UCC"><div><strong>SITP</strong><small>Universidad Cooperativa de Colombia</small></div></div>
      <p class="side-label">${ROLES[u.rol].label}</p>
      <nav>${nav.map(([k, l, i]) => `<button class="nav-item ${active === k ? 'active' : ''}" data-nav="${k}">${icon(i)}<span>${l}</span></button>`).join('')}</nav>
      <div class="side-user">
        <div class="avatar light">${initials(u.nombre)}</div>
        <div class="who"><strong>${esc(u.nombre)}</strong><small>${esc(u.email)}</small></div>
        <button class="icon-btn" id="logout" title="Cerrar sesión" aria-label="Cerrar sesión">${icon('out')}</button>
      </div>
    </aside>
    <main class="content" id="content">${content}</main>
  </div>`;
  $app.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => go(b.dataset.nav)));
  document.getElementById('logout').addEventListener('click', async () => {
    try { await api.logout(); } catch { /* sesión ya cerrada */ }
    setToken(null); Object.assign(state, { user: null, panel: null, project: null }); renderLogin();
  });
}
const $content = () => document.getElementById('content');

async function go(view, opts = {}) {
  Object.assign(state, { view }, opts);
  shell('<div class="loading"><div class="sk"></div><div class="sk tall"></div></div>');
  try {
    if (view !== 'proyecto' || !state.panel) state.panel = await api.panel();
    if (view === 'panel') return renderPanel();
    if (view === 'proyectos') return renderProjects();
    if (!state.projectId) return go('proyectos');
    state.project = await api.proyecto(state.projectId);
    renderProject();
  } catch (e) { handleError(e); }
}
function handleError(e) {
  if (e.status === 401) { setToken(null); state.user = null; renderLogin(); return toast('Tu sesión expiró. Ingresa de nuevo.', true); }
  $content().innerHTML = empty(e.message);
}

/* ---------- Panel: KPIs que también filtran + tabla con filtros + comentarios ---------- */
const ESTADO_PROY = (p) => p.estado !== 'En curso' ? p.estado : p.paraCorreccion ? 'Para corrección' : p.porRevisar ? 'Por revisar' : 'Al día';
const projectDefs = () => [
  { key: 'q', label: 'Buscar proyecto, grupo o estudiante', get: (p) => `${p.titulo} ${p.grupo} ${p.estudiantesInfo.map((s) => s.nombre).join(' ')}` },
  materiaFilter((p) => p.cursoActual),
  { key: 'programa', label: 'Programa', options: [['Ingeniería de Software', 'Ing. de Software'], ['Ingeniería Civil', 'Ing. Civil']], get: (p) => p.programa },
];
// El asesor metodológico no ve el filtro de autores
const comDefs = () => is('asesor_metodologico') ? [] : [{ key: 'rol', label: 'Autor', options: Object.entries(ROLES).map(([k, v]) => [k, v.label]), get: (c) => c.autor.rol }];
const openProject = (id) => go('proyecto', { projectId: Number(id), tab: 'info', openForm: null });
function bindOpen(root) {
  root.querySelectorAll('[data-open]').forEach((r) => {
    r.addEventListener('click', () => openProject(r.dataset.open));
    r.addEventListener('keydown', (e) => e.key === 'Enter' && openProject(r.dataset.open));
  });
  root.querySelectorAll('[data-go-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.goProject)));
}

function renderPanel() {
  const { proyectos, comentarios } = state.panel;
  const est = (state.filters.panel || {}).estado || '';
  const counts = { '': proyectos.length };
  proyectos.forEach((p) => { const k = ESTADO_PROY(p); counts[k] = (counts[k] || 0) + 1; });
  const kpis = [['', 'Todos los proyectos', 'teal'], ['Por revisar', 'Por revisar', 'lime'], ['Para corrección', 'Para corrección', 'gray'], ['Finalizado', 'Finalizados', 'green']];
  const rows = applyFilters('panel', projectDefs(), proyectos).filter((p) => !est || ESTADO_PROY(p) === est);
  const coms = applyFilters('com', comDefs(), comentarios);

  $content().innerHTML = `
    <header class="page-head"><div><h1>Hola, ${esc(firstName(state.user.nombre))}</h1>
      <p class="muted">${ROLES[state.user.rol].label} · Programas de Ingeniería de Software y Civil · Sede Medellín</p></div></header>
    <section class="kpis" role="tablist" aria-label="Filtrar por estado">${kpis.map(([k, l, c]) => `
      <button class="kpi ${c} ${est === k ? 'on' : ''}" data-estado="${k}" role="tab" aria-selected="${est === k}"><span>${l}</span><strong>${counts[k] || 0}</strong></button>`).join('')}</section>
    <div class="panel-grid">
      <section class="card flush">
        <div class="card-head"><h2>Proyectos</h2><span class="muted small">${rows.length} de ${proyectos.length}</span></div>
        ${filterBar('panel', projectDefs())}
        ${rows.length ? `<table class="ptable"><thead><tr><th>Grupo</th><th>Proyecto</th><th>Materia</th><th>Entregables</th><th>Fecha</th><th>Estado</th></tr></thead><tbody>
          ${rows.map((p) => `<tr data-open="${p.id}" tabindex="0">
            <td data-l="Grupo"><span class="mono">G-${esc(p.grupo)}</span></td>
            <td data-l="Proyecto"><strong class="clamp">${esc(p.titulo)}</strong><small class="muted">${esc(p.programa)} · ${esc(p.estudiantesInfo.map((s) => s.nombre.split(' ')[0]).join(', '))}</small></td>
            <td data-l="Materia" class="small">${esc(p.curso)}</td>
            <td data-l="Entregables">${p.totalEntregables}${p.porRevisar ? ` <span class="dot-count">${p.porRevisar} pend.</span>` : ''}</td>
            <td data-l="Fecha" class="small">${fdate(p.ultimaActividad)}</td>
            <td data-l="Estado">${pill(ESTADO_PROY(p))}</td></tr>`).join('')}</tbody></table>` : empty('Ningún proyecto coincide con los filtros.')}
      </section>
      <section class="card flush">
        <div class="card-head"><h2>Comentarios recientes</h2></div>
        ${comDefs().length ? filterBar('com', comDefs()) : ''}
        <div class="pad">${coms.length ? coms.map((c) => commentItem(c, true)).join('') : empty('Sin comentarios para este filtro.')}</div>
      </section>
    </div>`;

  $content().querySelectorAll('[data-estado]').forEach((b) => b.addEventListener('click', () => { state.filters.panel = { ...state.filters.panel, estado: b.dataset.estado }; renderPanel(); }));
  bindOpen($content());
  bindFilters($content(), (fromSearch) => { renderPanel(); if (fromSearch) refocus(); });
}
function refocus() { const i = $content().querySelector('input[data-f="q"]'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }

/* ---------- Proyectos: los abiertos, agrupados por grupo (desplegables) ---------- */
function renderProjects() {
  const open = state.panel.proyectos.filter((p) => p.estado === 'En curso');
  const rows = applyFilters('proyectos', projectDefs(), open);
  const groups = [...new Set(rows.map((p) => p.grupo))].sort();
  const searching = Object.values(state.filters.proyectos || {}).some(Boolean);
  $content().innerHTML = `
    <header class="page-head"><div><h1>Proyectos</h1><p class="muted">${open.length} proyecto(s) abierto(s) en ${new Set(open.map((p) => p.grupo)).size} grupo(s)</p></div></header>
    <section class="card flush">${filterBar('proyectos', projectDefs())}
      <div class="pad">${groups.length ? groups.map((g) => { const ps = rows.filter((p) => p.grupo === g); return `
        <details class="group" data-group="${esc(g)}" ${searching || state.openGroups.has(g) ? 'open' : ''}>
          <summary><strong>Proyectos - Grupo ${esc(g)}</strong><span class="muted small">${ps.length} proyecto(s)</span></summary>
          ${ps.map((p) => `<article class="pcard" data-open="${p.id}" tabindex="0">
            <div class="c-head"><strong>${esc(p.titulo)}</strong>${pill(ESTADO_PROY(p))}</div>
            <p class="small">${tag(p.curso, 'teal')} ${tag(p.programa)}</p>
            <p class="small muted">Estudiantes: ${esc(p.estudiantesInfo.map((s) => s.nombre).join(', '))} · Asesores: ${esc(p.asesorTecnico.nombre)}, ${esc(p.asesorMetodologico.nombre)}</p>
            <p class="small muted">${p.totalEntregables} entregable(s) · ${p.porRevisar} por revisar · ${p.paraCorreccion} para corrección · Actualizado ${fdate(p.ultimaActividad)}</p>
          </article>`).join('')}
        </details>`; }).join('') : empty('No hay proyectos abiertos para este filtro.')}</div>
    </section>`;
  $content().querySelectorAll('details.group').forEach((d) => d.addEventListener('toggle', () => { state.openGroups[d.open ? 'add' : 'delete'](d.dataset.group); }));
  bindOpen($content());
  bindFilters($content(), (fromSearch) => { renderProjects(); if (fromSearch) refocus(); });
}
function commentItem(c, withProject = false, about = '') {
  return `<article class="comment">
    <div class="avatar sm ${ROLES[c.autor.rol].css}">${initials(c.autor.nombre)}</div>
    <div class="c-body"><div class="c-head"><strong>${esc(c.autor.nombre)}</strong>${roleBadge(c.autor.rol)}<time>${fdate(c.fecha)}</time></div>
    ${withProject ? `<button class="link small" data-go-project="${c.proyectoId}">${esc(c.proyecto)}</button>` : ''}
    ${about ? `<p class="small muted">Sobre: ${esc(about)}</p>` : ''}<p>${esc(c.texto)}</p></div></article>`;
}

/* ---------- Proyecto: 4 pestañas sin duplicados ----------
   Información = datos generales, participantes y entregables (PDF, estados y revisiones)
   Actas       = actas con las revisiones y PDF de observaciones vinculados
   Historial   = movimientos + comentarios, agrupados por materia
   Objetivos   = objetivos con sus versiones */
const entLabel = (e) => `${e.codigo} · ${e.titulo} v${e.version}`;
const refLabel = (p, sobre, id) => sobre === 'entregable' ? entLabel(p.entregables.find((e) => e.id === id) || { codigo: '', titulo: 'Entregable', version: '' })
  : sobre === 'acta' ? `Acta N.º ${pad(p.actas.find((a) => a.id === id)?.numero ?? '')}` : 'Proyecto en general';
const refOptions = (p) => [['proyecto:', 'Proyecto en general'], ...p.entregables.map((e) => [`entregable:${e.id}`, `Entregable · ${entLabel(e)}`]), ...p.actas.map((a) => [`acta:${a.id}`, `Acta N.º ${pad(a.numero)}`])];
const feed = (p) => [...p.historial.map((h) => ({ ...h, kind: 'evento' })), ...p.comentarios.map((c) => ({ ...c, kind: 'comentario', tipo: 'Comentario' }))]
  .sort((a, b) => b.fecha.localeCompare(a.fecha));
const commentCount = (p, sobre, id) => p.comentarios.filter((c) => c.sobre === sobre && c.sobreId === id).length;
const commentsLink = (p, sobre, id) => `<button class="link small" data-ref="${sobre}:${id}">${commentCount(p, sobre, id)} comentario(s)</button>`;
const select = (name, opts, label, sel = '') => `<label>${label}<select name="${name}">${opts.map(([v, t]) => `<option value="${esc(v)}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
const pdfLink = (path, name, label = 'Ver PDF') => `<button class="link small pdf" data-pdf="${esc(path)}" data-name="${esc(name)}">${icon('file')}${esc(label)}</button>`;
const fileName = (rel) => (rel || '').split('/').pop();
const abierto = (p) => p.estado === 'En curso';
// Cada entregable del catálogo (E1, E2…) con sus versiones (PDF) y revisiones
const entregablesDe = (p) => p.catalogo.filter((d) => d.curso <= p.cursoActual).map((d) => {
  const versiones = p.entregables.filter((e) => e.defId === d.id).sort((a, b) => b.version - a.version);
  const ids = versiones.map((v) => v.id);
  return { ...d, versiones, ultima: versiones[0], revs: p.revisiones.filter((r) => ids.includes(r.entregableId)) };
}).sort((a, b) => b.curso - a.curso || a.codigo.localeCompare(b.codigo));
const estadoEnt = (d) => d.ultima ? d.ultima.estado : 'Pendiente';
const actaOpts = (p) => [['', 'Sin acta'], ...p.actas.map((a) => [a.id, `Acta N.º ${pad(a.numero)} · ${fdate(a.fecha)}`])];

function revisionItem(r) {
  return `<div class="rev ${r.tipo}"><div class="c-head">${roleBadge(REVISOR[r.tipo])}${pill(r.estado)}${r.nota != null ? `<span class="nota">${Number(r.nota).toFixed(1)}</span>` : ''}
    ${r.actaNumero ? tag(`Acta N.º ${pad(r.actaNumero)}`, 'teal') : ''}<time>${fdate(r.fecha)}</time></div>
    ${r.observaciones ? `<p><b>Observaciones:</b> ${esc(r.observaciones)}</p>` : ''}${r.correcciones ? `<p class="fix"><b>Correcciones:</b> ${esc(r.correcciones)}</p>` : ''}
    <p class="small muted">${esc(r.autor.nombre)}${r.pdf ? ` · ${pdfLink(`/revisiones/${r.id}/pdf`, fileName(r.pdf), 'PDF de observaciones')}` : ''}</p></div>`;
}
function reviewForm(p, e) {
  const met = is('asesor_metodologico');
  return `<details class="rev-form"><summary>Registrar revisión de ${esc(entLabel(e))}</summary>
    <form class="form" data-review="${e.id}"><div class="row">${select('actaId', actaOpts(p), 'Acta relacionada', p.actas[0]?.id ?? '')}
      ${met ? `<div class="row"><label>Estado<select name="estado">${ESTADOS_ENT.slice(1).map((s) => `<option>${s}</option>`).join('')}</select></label>
        <label>Nota (0 a 5)<input name="nota" type="number" min="0" max="5" step="0.1"></label></div>` : '<p class="small muted">El asesor técnico no califica. Si escribes observaciones o correcciones se genera un PDF vinculado al acta.</p>'}</div>
      <div class="row"><label>${met ? 'Observaciones' : 'Comentarios y sugerencias'}<textarea name="observaciones" rows="2"></textarea></label>
        <label>Correcciones que debe hacer el estudiante<textarea name="correcciones" rows="2"></textarea></label></div>
      <div class="row-end"><button class="btn sm">Guardar revisión</button></div></form></details>`;
}
function entregableCard(p, d, rev) {
  const e = d.ultima, revs = d.revs.filter((r) => !rev || r.tipo === rev);
  const revsOf = (v) => revs.filter((r) => r.entregableId === v.id).map(revisionItem).join('');
  const verRow = (v) => `<div class="ver-row"><div class="c-head">${tag('v' + v.version)}${pdfLink(`/entregables/${v.id}/archivo`, fileName(v.archivo), fileName(v.archivo))}<time>${fdate(v.fecha)}</time></div>
    <p class="small muted">${esc(v.autor.nombre)}${v.descripcion ? ` · ${esc(v.descripcion)}` : ''} · ${commentsLink(p, 'entregable', v.id)}</p>${revsOf(v)}</div>`;
  return `<article class="item ent-card ${estadoEnt(d) === 'Para corrección' ? 'warn' : ''}">
    <div class="c-head"><span class="code">${esc(d.codigo)}</span><strong>${esc(d.nombre)}</strong>${tag(mat(d.curso))}${pill(estadoEnt(d))}${e?.nota != null ? `<span class="nota">${Number(e.nota).toFixed(1)}</span>` : ''}</div>
    ${e ? verRow(e) + (d.versiones.length > 1 ? `<details><summary>${d.versiones.length - 1} versión(es) anterior(es)</summary>${d.versiones.slice(1).map(verRow).join('')}</details>` : '')
      : `<p class="small muted">${d.curso === p.cursoActual ? 'Aún no se ha subido el PDF.' : 'No se entregó en esta materia.'}</p>`}
    ${e && is('asesor_tecnico', 'asesor_metodologico') && abierto(p) ? reviewForm(p, e) : ''}</article>`;
}
function infoIntro(p) {
  const person = (u) => `<div class="person"><div class="avatar sm ${ROLES[u.rol].css}">${initials(u.nombre)}</div><div><strong>${esc(u.nombre)}</strong><small class="muted">${esc(u.email)}</small></div></div>`;
  const canEdit = abierto(p) && is('estudiante', 'asesor_metodologico');
  return `<div class="info-grid pad">
    <section><h3>Información del proyecto</h3><dl class="dl">
      <dt>Título</dt><dd>${esc(p.titulo)}</dd><dt>Programa</dt><dd>${esc(p.programa)}</dd><dt>Grupo</dt><dd>${esc(p.grupo)}</dd>
      <dt>Materia actual</dt><dd>${esc(p.curso)}</dd><dt>Estado</dt><dd>${pill(p.estado)}</dd><dt>Registrado</dt><dd>${fdate(p.creado)}</dd>
      <dt>Actas</dt><dd>${p.actas.length}</dd></dl>
      ${canEdit ? `<div class="row-start"><button class="btn ghost sm" data-edit>Editar información</button>${is('asesor_metodologico') ? '<button class="btn ghost sm danger" data-cancel-proj>Cancelar proyecto</button>' : ''}</div>` : ''}</section>
    <section class="people"><h3>Estudiantes</h3>${p.estudiantesInfo.map(person).join('')}
      <h3>Asesor técnico</h3>${person(p.asesorTecnico)}<h3>Asesor metodológico</h3>${person(p.asesorMetodologico)}</section></div>
    <h3 class="sec-title">Entregables</h3>`;
}

const TABS = {
  info: {
    label: 'Información del proyecto', items: entregablesDe, intro: infoIntro,
    filters: (p) => [
      materiaFilter((d) => d.curso),
      { key: 'estado', label: 'Estado', options: ['Pendiente', ...ESTADOS_ENT].map((s) => [s, s]), get: estadoEnt },
      { key: 'rev', label: 'Revisiones de', options: [['tecnica', 'Asesor técnico'], ['metodologica', 'Asesor metodológico']], match: (d, v) => d.revs.some((r) => r.tipo === v) },
    ],
    create: (p) => is('estudiante') && abierto(p) && { kind: 'entregable', label: 'Subir PDF de entregable', html: `<div class="row">
      ${select('defId', p.catalogo.filter((d) => d.curso === p.cursoActual).map((d) => [d.id, `${d.codigo} · ${d.nombre}`]), `Entregable de ${esc(p.curso)}`)}
      <label>Archivo PDF<input name="archivo" type="file" accept="application/pdf,.pdf" required></label></div>
      <label>Descripción (opcional)<input name="descripcion" maxlength="1000" placeholder="Qué cambió en esta versión"></label>
      <p class="small muted">El archivo se renombra solo con el grupo, la materia, el entregable y la versión (ej.: G${esc(p.grupo)}_M${p.cursoActual}_E1_…_v2.pdf).</p>` },
    list: (items, p) => items.map((d) => entregableCard(p, d, (state.filters.info || {}).rev)).join(''),
  },
  actas: {
    label: 'Actas', items: (p) => p.actas,
    filters: () => [materiaFilter((a) => a.curso)],
    create: (p) => is('asesor_tecnico', 'asesor_metodologico') && { kind: 'acta', label: `Nueva acta N.º ${pad(p.actas.length + 1)}`, html: `<div class="row"><label>Fecha<input name="fecha" type="date" value="${new Date().toISOString().slice(0, 10)}"></label><span></span></div>
          <div class="row"><label>Temas tratados<textarea name="temas" rows="2" required></textarea></label><label>Compromisos<textarea name="compromisos" rows="2"></textarea></label></div>` },
    list: (items, p) => items.map((d) => { const revs = p.revisiones.filter((r) => r.actaId === d.id); return `<article class="item acta"><div class="acta-n">N.º ${pad(d.numero)}</div><div class="ent-main">
          <div class="c-head">${tag(mat(d.curso), 'teal')}${roleBadge(d.autor.rol)}<time>${fdate(d.fecha)}</time></div>
          <p><b>Temas:</b> ${esc(d.temas)}</p>${d.compromisos ? `<p><b>Compromisos:</b> ${esc(d.compromisos)}</p>` : ''}
          ${revs.length ? `<p class="small"><b>Revisiones vinculadas:</b></p><ul class="links">${revs.map((r) => { const e = p.entregables.find((x) => x.id === r.entregableId); return `<li>${roleBadge(REVISOR[r.tipo])} ${esc(entLabel(e))} ${pill(r.estado)}${r.pdf ? ' ' + pdfLink(`/revisiones/${r.id}/pdf`, fileName(r.pdf), 'PDF de observaciones') : ''}</li>`; }).join('')}</ul>` : ''}
          <p class="small muted">${esc(d.autor.nombre)} · ${commentsLink(p, 'acta', d.id)}</p></div></article>`; }).join(''),
  },
  historial: {
    label: 'Historial', items: feed,
    filters: (p) => [
      materiaFilter((x) => x.curso),
      { key: 'tipo', label: 'Acción', options: [...new Set(feed(p).map((x) => x.tipo))].map((t) => [t, t]), get: (x) => x.tipo },
      ...(is('asesor_metodologico') ? [] : [{ key: 'rol', label: 'Autor', options: Object.entries(ROLES).map(([k, v]) => [k, v.label]), get: (x) => x.autor.rol }]),
      { key: 'ref', label: 'Sobre', options: refOptions(p), get: (x) => x.kind === 'comentario' ? `${x.sobre}:${x.sobreId ?? ''}` : '' },
    ],
    create: (p) => ({ kind: 'comentario', fixed: true, label: 'Publicar comentario', html: `<div class="row compact">${select('ref', refOptions(p), 'Sobre')}
      <label>Comentario<textarea name="texto" rows="1" required placeholder="Visible para ambos asesores y los estudiantes"></textarea></label></div>` }),
    // agrupado por materia para que no se mezclen los registros
    list: (items, p) => [3, 2, 1].filter((n) => items.some((x) => x.curso === n)).map((n) => `<h3 class="group-h">${esc(mat(n))}</h3><ol class="timeline">${items.filter((x) => x.curso === n).map((x) => x.kind === 'comentario'
      ? `<li class="is-com"><span class="dot"></span>${commentItem(x, false, x.sobre !== 'proyecto' ? refLabel(p, x.sobre, x.sobreId) : '')}</li>`
      : `<li><span class="dot"></span><div><div class="c-head"><strong>${esc(x.tipo)}</strong><time>${fdate(x.fecha)} · ${new Date(x.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</time></div>
         <p>${esc(x.detalle)}</p><p class="small muted">${esc(x.autor.nombre)} · ${ROLES[x.autor.rol].label}</p></div></li>`).join('')}</ol>`).join(''),
  },
  objetivos: {
    label: 'Objetivos', items: (p) => p.objetivos,
    filters: () => [{ key: 'tipo', label: 'Tipo', options: [['General', 'General'], ['Específico', 'Específico']], get: (o) => o.tipo }],
    create: (p) => is('estudiante', 'asesor_metodologico') && { kind: 'objetivo', label: 'Nueva versión', html: `<div class="row">
      ${select('objetivoId', [['', 'Nuevo objetivo'], ...p.objetivos.map((o, i) => [o.id, `${o.tipo} ${i + 1} · ${o.versiones.at(-1).texto.slice(0, 50)}…`])], 'Objetivo')}
      ${select('tipo', [['Específico', 'Específico'], ['General', 'General']], 'Tipo (si es nuevo)')}</div>
      <label>Redacción<textarea name="texto" rows="2" required minlength="10"></textarea></label>
      <label>Motivo del cambio<input name="motivo" placeholder="Ej.: ajuste de alcance acordado en el Acta N.º 02"></label>` },
    list: (items) => items.map((o) => { const cur = o.versiones.at(-1); return `<article class="item">
      <div class="c-head">${tag(o.tipo, o.tipo === 'General' ? 'teal' : '')}${tag(`v${cur.v} · ${mat(cur.curso)}`)}<time>${fdate(cur.fecha)}</time></div>
      <p class="obj-text">${esc(cur.texto)}</p><p class="small muted">${esc(cur.motivo)} · ${esc(cur.autor.nombre)}</p>
      ${o.versiones.length > 1 ? `<details><summary>${o.versiones.length - 1} versión(es) anterior(es)</summary>${o.versiones.slice(0, -1).reverse().map((v) => `<div class="ver">${tag(`v${v.v} · ${mat(v.curso)}`)}<p>${esc(v.texto)}</p><p class="small muted">${esc(v.motivo)} · ${esc(v.autor.nombre)} · ${fdate(v.fecha)}</p></div>`).join('')}</details>` : ''}</article>`; }).join(''),
  },
};

function renderProject() {
  const p = state.project, ps = state.panel?.proyectos || [];
  const finished = p.estado === 'Finalizado';
  if (!TABS[state.tab]) state.tab = 'info';
  $content().innerHTML = `
    <header class="proj-head">
      <div class="ph-top"><button class="link light" data-back>← Proyectos</button>${tag(`${p.programa} · Grupo ${p.grupo}`, 'light')}${pill(p.estado)}
        ${ps.length > 1 ? `<select id="projSel" aria-label="Cambiar de proyecto">${ps.map((x) => `<option value="${x.id}" ${x.id === p.id ? 'selected' : ''}>G-${esc(x.grupo)} · ${esc(x.titulo)}</option>`).join('')}</select>` : ''}</div>
      <h1>${esc(p.titulo)}</h1>
      <div class="course-track">${[1, 2, 3].map((n) => `<div class="ct ${n < p.cursoActual || finished ? 'done' : n === p.cursoActual ? 'now' : ''}"><span>${n}</span><small>${esc(p.cursos[n])}</small></div>`).join('')}</div>
      ${is('asesor_metodologico') && abierto(p) ? `<div class="team"><button class="btn lime" id="avanzar">${p.cursoActual < 3 ? 'Avanzar a ' + esc(p.cursos[p.cursoActual + 1]) : 'Finalizar proyecto'}</button></div>` : ''}
    </header>
    <nav class="tabs" role="tablist">${Object.entries(TABS).map(([k, t]) => `<button role="tab" aria-selected="${state.tab === k}" class="${state.tab === k ? 'active' : ''}" data-tab="${k}">${t.label}<span>${t.items(p).length}</span></button>`).join('')}</nav>
    <section class="card flush" id="tabBody"></section>`;

  $content().querySelector('[data-back]').addEventListener('click', () => go('proyectos'));
  document.getElementById('projSel')?.addEventListener('change', (e) => go('proyecto', { projectId: Number(e.target.value), openForm: null }));
  $content().querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { state.tab = b.dataset.tab; state.openForm = null; renderProject(); }));
  document.getElementById('avanzar')?.addEventListener('click', async () => {
    const next = p.cursoActual < 3;
    const ok = await confirmDialog(next ? 'Avanzar de materia' : 'Finalizar proyecto',
      next ? `El proyecto pasará a "${p.cursos[p.cursoActual + 1]}". Objetivos, actas, entregables y comentarios se conservan, así que no hay que volver a pedir el anteproyecto.` : 'El proyecto quedará marcado como finalizado.');
    if (!ok) return;
    try { await api.avanzar(p.id); toast('Materia actualizada'); state.panel = null; go('proyecto', { tab: 'info' }); } catch (e) { toast(e.message, true); }
  });
  renderTab();
}

function renderTab() {
  const p = state.project, t = TABS[state.tab], body = document.getElementById('tabBody');
  const defs = t.filters(p), scope = state.tab;
  const items = applyFilters(scope, defs, t.items(p));
  const c = t.create(p) || null;
  const open = c && (c.fixed || state.openForm === state.tab);
  body.innerHTML = `${t.intro ? t.intro(p) : ''}
    <div class="card-head">${filterBar(scope, defs)}${c && !open ? `<button class="btn sm" data-new>${icon('plus')}${c.label}</button>` : ''}</div>
    ${open ? `<form class="form compose" data-form="${c.kind}">${c.html}<div class="row-end">${c.fixed ? '' : '<button type="button" class="btn ghost" data-cancel>Cancelar</button>'}<button class="btn">${c.fixed ? c.label : 'Guardar'}</button></div></form>` : ''}
    <div class="pad">${items.length ? t.list(items, p) : empty('No hay registros para este filtro.')}</div>`;
  body.querySelector('[data-new]')?.addEventListener('click', () => { state.openForm = state.tab; renderTab(); body.querySelector('.compose select, .compose textarea, .compose input')?.focus(); });
  body.querySelector('[data-cancel]')?.addEventListener('click', () => { state.openForm = null; renderTab(); });
  body.querySelectorAll('[data-ref]').forEach((b) => b.addEventListener('click', () => { state.filters.historial = { ref: b.dataset.ref }; state.tab = 'historial'; renderProject(); }));
  body.querySelectorAll('[data-pdf]').forEach((b) => b.addEventListener('click', () => openPdf(b.dataset.pdf, b.dataset.name)));
  body.querySelector('[data-edit]')?.addEventListener('click', () => projectAction('editar', 'Editar información', 'Cada cambio queda registrado en el historial.',
    `<label>Título<input name="titulo" required maxlength="255" value="${esc(p.titulo)}"></label>${is('asesor_metodologico') ? `<label>Grupo<input name="grupo" maxlength="10" value="${esc(p.grupo)}"></label>` : ''}`, 'Información actualizada'));
  body.querySelector('[data-cancel-proj]')?.addEventListener('click', () => projectAction('cancelar', 'Cancelar proyecto', 'El proyecto quedará cancelado y ya no admitirá cambios. El historial se conserva.',
    '<label>Motivo<textarea name="motivo" rows="2" required minlength="5"></textarea></label>', 'Proyecto cancelado'));
  bindFilters(body, (fromSearch) => { renderTab(); if (fromSearch) refocus(); });
  bindForms(body);
}
async function projectAction(kind, title, text, fields, msg) {
  const d = await confirmDialog(title, text, fields);
  if (!d) return;
  try { await api[kind](state.project.id, d); toast(msg); state.panel = null; go('proyecto'); } catch (e) { toast(e.message, true); }
}

// Convierte los valores del formulario al tipo que espera la API (Flask)
const num = (v) => (v === '' || v == null ? null : Number(v));
function toPayload(kind, f) {
  if (kind === 'entregable') return new FormData(f); // PDF en multipart
  const d = Object.fromEntries(new FormData(f));
  if (kind === 'comentario') { const [sobre, id] = d.ref.split(':'); return { sobre, sobreId: num(id), texto: d.texto }; }
  if (kind === 'objetivo') return { ...d, objetivoId: num(d.objetivoId) };
  if (kind === 'acta') return { ...d, fecha: d.fecha || null };
  return d;
}
function bindForms(root) {
  const p = state.project;
  const MSG = { objetivo: 'Versión del objetivo guardada', entregable: 'PDF subido y renombrado', acta: 'Acta registrada', comentario: 'Comentario publicado' };
  const reload = async () => { state.openForm = null; state.project = await api.proyecto(p.id); renderProject(); };
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

/* ---------- Arranque ---------- */
(async function boot() {
  if (!hasToken()) return renderLogin();
  try { state.user = (await api.me()).user; go('panel'); } catch { setToken(null); renderLogin(); }
})();
