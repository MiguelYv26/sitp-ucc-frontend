// Página «Administración»: vistas independientes con sidebar limpio.
import { applyFilters, bindFilters, FilterBar, projectFilters } from '../components/filters/FilterBar.js';
import { Icon } from '../components/ui/Icon.js';
import { Empty, Pill, RoleBadge, Switch } from '../components/ui/Badges.js';
import { toast } from '../components/ui/Toast.js';
import { ROLES } from '../constants/index.js';
import { $content, refocus } from '../core/dom.js';
import { navigate } from '../core/router.js';
import { api } from '../services/api.js';
import { state } from '../store/state.js';
import { esc } from '../utils/format.js';
import { estadoProyecto } from '../store/selectors.js';

// Todos los roles disponibles para asignar en multi-rol
const ALL_ROLES = ['estudiante', 'asesor_tecnico', 'asesor_metodologico', 'jurado', 'docente', 'administrador'];

const userFilters = [
  { key: 'q', label: 'Buscar por nombre o correo', get: (u) => `${u.nombre} ${u.email}` },
  { key: 'rol', label: 'Rol', options: ALL_ROLES.map((r) => [r, ROLES[r]?.label || r]), get: (u) => (u.roles || [u.rol]).join(' ') },
  { key: 'activo', label: 'Estado', options: [['1', 'Activo'], ['0', 'Inactivo']], get: (u) => (u.activo ? '1' : '0') },
];

// ---------- Modal de usuario (crear / editar) ----------
function ModalUsuario(u = null) {
  const edit = Boolean(u);
  const roles = u?.roles || ['estudiante'];
  const checks = ALL_ROLES.map((r) =>
    `<label class="role-check"><input type="checkbox" name="roles" value="${r}" ${roles.includes(r) ? 'checked' : ''}> ${ROLES[r]?.label || r}</label>`
  ).join('');
  return `<div class="modal-backdrop" id="userModal" role="dialog" aria-modal="true" aria-label="${edit ? 'Editar' : 'Nuevo'} usuario">
    <div class="modal-box">
      <div class="modal-head">
        <h2>${edit ? 'Editar usuario' : 'Nuevo usuario'}</h2>
        <button class="btn ghost icon" data-close-modal aria-label="Cerrar">&times;</button>
      </div>
      <form id="userForm" class="form pad">
        ${edit ? `<input type="hidden" name="uid" value="${u.id}">` : ''}
        <div class="row">
          <label>Nombre completo<input name="nombre" required minlength="3" maxlength="120" value="${esc(u?.nombre || '')}"></label>
          <label>Correo institucional<input name="email" type="email" required maxlength="160" value="${esc(u?.email || '')}"></label>
        </div>
        <label>Programa (estudiantes)
          <select name="programa">
            <option value="">No aplica</option>
            ${(state.panel?.programas || []).map((n) => `<option ${u?.programa === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}
          </select>
        </label>
        <fieldset>
          <legend>Roles asignados</legend>
          <div class="role-checks">${checks}</div>
        </fieldset>
        ${!edit ? `<label>Contraseña inicial<input name="password" type="password" required minlength="8" maxlength="64" autocomplete="new-password"></label>` : ''}
        <div class="row-end">
          ${edit ? `
            <button type="button" class="btn danger ghost sm" data-delete-user="${u.id}">Eliminar</button>
            <button type="button" class="btn ghost sm" data-toggle-activo="${u.id}" data-activo="${u.activo ? '1' : '0'}">${u.activo ? 'Desactivar' : 'Activar'}</button>
          ` : ''}
          <button type="button" class="btn ghost" data-close-modal>Cancelar</button>
          <button class="btn">${edit ? 'Guardar cambios' : 'Crear usuario'}</button>
        </div>
      </form>
    </div>
  </div>`;
}

function _rolesFromForm(form) {
  return [...form.querySelectorAll('input[name="roles"]:checked')].map((c) => c.value);
}

// ---------- Vistas del área principal ----------
function Usuarios() {
  const { usuarios } = state.admin;
  const rows = applyFilters('usuarios', userFilters, usuarios);
  return `<div class="card-head">
      ${FilterBar('usuarios', userFilters)}
      <button class="btn sm" data-new-user>${Icon('plus')}Nuevo usuario</button>
    </div>
    ${rows.length ? `<table class="ptable admin">
      <thead><tr><th>Usuario</th><th>Roles</th><th>Proyectos</th><th>Activo</th><th></th></tr></thead>
      <tbody>${rows.map((u) => `<tr>
        <td data-l="Usuario"><strong>${esc(u.nombre)}</strong><small class="muted">${esc(u.email)}</small></td>
        <td data-l="Roles">${(u.roles || [u.rol]).map((r) => RoleBadge(r)).join(' ')}</td>
        <td data-l="Proyectos">${u.proyectos ?? 0}</td>
        <td data-l="Activo">${u.id === state.user.id
          ? '<span class="small muted">Tu cuenta</span>'
          : Switch(`data-activo="${u.id}"`, u.activo, `Cuenta de ${esc(u.nombre)} activa`)}</td>
        <td data-l=""><button class="btn ghost sm" data-edit-user="${u.id}">Gestionar</button></td>
      </tr>`).join('')}</tbody>
    </table>` : Empty('Ningún usuario coincide con la búsqueda.')}`;
}

const Lista = (tipo, titulo, items) =>
  `<section class="cat"><h3>${titulo}</h3>
  ${(items || []).map((x) => `<div class="cat-row"><span>${esc(x.nombre)}</span>${Switch(`data-cat="${tipo}" data-id="${x.id}"`, x.activo, `${x.nombre} activo`)}</div>`).join('')}
  <form class="cat-add" data-add="${tipo}">
    <input name="nombre" required minlength="2" maxlength="80" placeholder="Agregar ${titulo.toLowerCase().slice(0, -1)}" aria-label="Agregar a ${titulo}">
    <button class="btn sm">Agregar</button>
  </form></section>`;

function Cursos() {
  const c = state.admin.catalogos;
  const materiasList = Array.isArray(c?.materias)
    ? c.materias
    : Object.entries(c?.materias || {}).map(([id, nombre]) => ({ id: Number(id), nombre }));
  return `<div class="pad cat-grid">
    <section class="cat"><h3>Cursos (etapas del proyecto)</h3>
      ${materiasList.sort((a, b) => a.id - b.id).map((m) =>
        `<form class="cat-add" data-materia="${m.id}">
          <span class="mono">${m.id}</span>
          <input name="nombre" required minlength="3" maxlength="80" value="${esc(m.nombre)}" aria-label="Nombre del curso ${m.id}">
          <button class="btn ghost sm">Renombrar</button>
        </form>`
      ).join('')}
    </section>
  </div>`;
}

function ProgramasYSemestres() {
  const c = state.admin.catalogos;
  return `<div class="pad cat-grid">
    ${Lista('programas', 'Programas', c.programas)}
    ${Lista('semestres', 'Semestres', c.semestres)}
  </div>`;
}

function EntregablesPorCurso() {
  const c = state.admin.catalogos;
  return `<div class="pad cat-grid">
    <section class="cat"><h3>Entregables por Curso</h3>
      ${(c.entregables || []).map((e) =>
        `<div class="cat-row"><span><b>${esc(e.codigo)}</b> ${esc(e.nombre)}</span><span class="tag">Curso ${e.curso}</span></div>`
      ).join('')}
    </section>
    <section class="cat"><h3>Criterios de la rúbrica</h3>
      ${(c.criterios || []).map((k) =>
        `<div class="cat-row"><span>${esc(k.nombre)}</span><span class="tag">${k.peso}%</span></div>`
      ).join('')}
    </section>
  </div>`;
}

function Auditoria() {
  const ds = (state.admin?.usuarios || []).filter((u) =>
    (u.roles || [u.rol]).some((r) => ['docente', 'asesor_tecnico', 'asesor_metodologico', 'jurado'].includes(r))
  );
  const ps = state.panel?.proyectos || [];
  const rows = applyFilters('audit', projectFilters(), ps);
  const sel = (p, k, id, opt) =>
    `<select data-asig="${k}" aria-label="${k} de G-${esc(p.grupo)}">
      ${opt ? '<option value="">Sin jurado</option>' : ''}
      ${ds.map((d) => `<option value="${d.id}" ${d.id === id ? 'selected' : ''}>${esc(d.nombre)}</option>`).join('')}
    </select>`;
  return `${FilterBar('audit', projectFilters())}
    ${rows.length ? `<table class="ptable admin">
      <thead><tr><th>Proyecto</th><th>Técnico</th><th>Metodológico</th><th>Jurado</th><th></th></tr></thead>
      <tbody>${rows.map((p) => `<tr data-pid="${p.id}">
        <td data-l="Proyecto"><strong class="clamp">G-${esc(p.grupo)} · ${esc(p.titulo)}</strong><small class="muted">${esc(p.curso)} · ${Pill(estadoProyecto(p))}</small></td>
        <td data-l="Técnico">${sel(p, 'tecnico', p.asesorTecnicoId)}</td>
        <td data-l="Metodológico">${sel(p, 'metodologico', p.asesorMetodologicoId)}</td>
        <td data-l="Jurado">${sel(p, 'jurado', p.juradoId, true)}</td>
        <td data-l=""><div class="acts">
          <button class="btn sm" data-save>Guardar</button>
          <button class="btn ghost sm" data-ver>Ver</button>
        </div></td>
      </tr>`).join('')}</tbody>
    </table>` : Empty('Ningún proyecto coincide con los filtros.')}`;
}

// ---------- Mapa de vistas del sidebar ----------
const VIEWS = {
  usuarios:     { label: 'Gestión de Usuarios',      render: Usuarios },
  cursos:       { label: 'Cursos',                   render: Cursos },
  programas:    { label: 'Programas y Semestres',    render: ProgramasYSemestres },
  entregables:  { label: 'Entregables por Curso',    render: EntregablesPorCurso },
  auditoria:    { label: 'Auditoría global',          render: Auditoria },
};

async function refresh(msg, panel = false) {
  const [usuarios, catalogos, p] = await Promise.all([api.usuarios(), api.catalogos(), panel ? api.panel() : state.panel]);
  state.admin = { usuarios, catalogos }; state.panel = p;
  toast(msg); AdminPage();
}

const run = async (call, msg, panel) => {
  try { await call(); await refresh(msg, panel); }
  catch (e) { toast(e.message, true); AdminPage(); }
};

export function AdminPage() {
  const view = VIEWS[state.adminTab] ? state.adminTab : 'usuarios';
  const { label, render } = VIEWS[view];

  $content().innerHTML = `
    <div class="admin-layout">
      <aside class="admin-sidebar">
        <div class="sidebar-head"><h2>Administración</h2></div>
        <nav class="sidebar-nav">
          ${Object.entries(VIEWS).map(([k, { label: l }]) =>
            `<button class="sidebar-item ${view === k ? 'active' : ''}" data-aview="${k}">${l}</button>`
          ).join('')}
        </nav>
      </aside>
      <main class="admin-main">
        <header class="page-head">
          <div>
            <h1>${label}</h1>
            <p class="muted">${state.admin.usuarios.length} usuarios · ${state.panel.proyectos.length} proyectos</p>
          </div>
        </header>
        <section class="card flush" id="adminBody">${render()}</section>
      </main>
    </div>`;

  const root = $content();

  // Sidebar navigation
  root.querySelectorAll('[data-aview]').forEach((b) =>
    b.addEventListener('click', () => { state.adminTab = b.dataset.aview; AdminPage(); })
  );

  bindFilters(root, (fromSearch) => { AdminPage(); if (fromSearch) refocus(root); });

  // --- Gestión de usuarios: Modal ---
  function openModal(u = null) {
    document.getElementById('userModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', ModalUsuario(u));
    const modal = document.getElementById('userModal');

    const closeModal = () => modal.remove();
    modal.querySelectorAll('[data-close-modal]').forEach((b) => b.addEventListener('click', closeModal));
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

    // Submit: crear o editar
    modal.querySelector('#userForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const d = Object.fromEntries(fd);
      d.roles = _rolesFromForm(modal);
      const uid = d.uid;
      if (uid) {
        await run(() => api.actualizarUsuario(uid, d).then(closeModal), 'Usuario actualizado');
      } else {
        await run(() => api.crearUsuario(d).then(closeModal), 'Usuario creado');
      }
    });

    // Toggle activo / desactivar
    modal.querySelector('[data-toggle-activo]')?.addEventListener('click', async function () {
      const uid = this.dataset.toggleActivo;
      const activo = this.dataset.activo !== '1';
      await run(() => api.actualizarUsuario(uid, { activo }).then(closeModal), activo ? 'Cuenta activada' : 'Cuenta desactivada');
    });

    // Eliminar usuario
    modal.querySelector('[data-delete-user]')?.addEventListener('click', async function () {
      const uid = this.dataset.deleteUser;
      if (!confirm('¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer.')) return;
      await run(() => api.eliminarUsuario(uid).then(closeModal), 'Usuario eliminado');
    });
  }

  // Botón "Nuevo usuario"
  root.querySelector('[data-new-user]')?.addEventListener('click', () => openModal());

  // Botón "Gestionar" por fila
  root.querySelectorAll('[data-edit-user]').forEach((b) =>
    b.addEventListener('click', () => {
      const u = state.admin.usuarios.find((x) => x.id === Number(b.dataset.editUser));
      if (u) openModal(u);
    })
  );

  // Toggle activo directo desde tabla (switch)
  root.querySelectorAll('[data-activo]').forEach((c) =>
    c.addEventListener('change', () =>
      run(() => api.actualizarUsuario(c.dataset.activo, { activo: c.checked }), c.checked ? 'Cuenta activada' : 'Cuenta desactivada')
    )
  );

  // --- Catálogos ---
  root.querySelectorAll('[data-cat]').forEach((c) =>
    c.addEventListener('change', () =>
      run(() => api.actualizarCatalogo(c.dataset.cat, c.dataset.id, { activo: c.checked }), 'Catálogo actualizado', true)
    )
  );
  root.querySelectorAll('[data-add]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      run(() => api.crearCatalogo(f.dataset.add, f.elements.nombre.value.trim()), 'Elemento agregado', true);
    })
  );
  root.querySelectorAll('[data-materia]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      run(() => api.actualizarCatalogo('materias', f.dataset.materia, { nombre: f.elements.nombre.value.trim() }), 'Curso renombrado', true);
    })
  );

  // --- Auditoría ---
  root.querySelectorAll('tr[data-pid]').forEach((tr) => {
    const v = (k) => Number(tr.querySelector(`[data-asig="${k}"]`).value) || null;
    tr.querySelector('[data-save]')?.addEventListener('click', () =>
      run(() => api.asignar(tr.dataset.pid, { tecnico: v('tecnico'), metodologico: v('metodologico'), jurado: v('jurado') }), 'Asignación guardada', true)
    );
    tr.querySelector('[data-ver]')?.addEventListener('click', () =>
      navigate('proyecto', { projectId: Number(tr.dataset.pid), tab: 'info', openForm: null })
    );
  });
}
