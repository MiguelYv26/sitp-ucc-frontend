// <Layout/>: barra lateral (marca, menú por rol, usuario + Role Switcher) + contenido.
import { LOGO, ROLES } from '../../constants/index.js';
import { navigate } from '../../core/router.js';
import { $app } from '../../core/dom.js';
import { state, userRoles, isAdmin } from '../../store/state.js';
import { esc, initials } from '../../utils/format.js';
import { Icon } from '../ui/Icon.js';

const NAV = {
  estudiante: [['panel', 'Mi proyecto', 'folder']],
  docente: [['panel', 'Panel', 'home'], ['proyectos', 'Proyectos', 'folder']],
  asesor_tecnico: [['panel', 'Panel', 'home'], ['proyectos', 'Proyectos', 'folder']],
  asesor_metodologico: [['panel', 'Panel', 'home'], ['proyectos', 'Proyectos', 'folder']],
  jurado: [['panel', 'Panel', 'home'], ['proyectos', 'Proyectos', 'folder']],
  administrador: [['admin', 'Administración', 'gear'], ['panel', 'Panel', 'home']],
};
const HOME = { estudiante: 'panel', docente: 'proyectos', asesor_tecnico: 'proyectos', asesor_metodologico: 'proyectos', jurado: 'proyectos', administrador: 'admin' };

function RoleSwitcher(rolActivo, onSwitch) {
  const roles = isAdmin()
    // Admin puede alternar entre su rol admin y todos los demás roles del sistema
    ? ['administrador', 'asesor_tecnico', 'asesor_metodologico', 'jurado', 'estudiante']
    : userRoles();
  if (roles.length <= 1) return '';
  const label = ROLES[rolActivo]?.label || rolActivo;
  return `<div class="role-switcher" id="roleSwitcher">
    <button class="role-switcher-btn" id="roleSwitcherBtn" aria-haspopup="true" aria-expanded="false">
      ${Icon('swap')} ${label}
    </button>
    <div class="role-menu" id="roleMenu" hidden>
      <div class="role-menu-sep"></div>
      ${roles.map((r) =>
        `<button class="role-menu-opt ${r === rolActivo ? 'active' : ''}" data-swap-rol="${r}">${ROLES[r]?.label || r}</button>`
      ).join('')}
    </div>
  </div>`;
}

export function Layout(content, onLogout, onSwitchRol) {
  const u = state.user;
  const rolActivo = state.rolActivo || u.rol;
  const navKey = NAV[rolActivo] ? rolActivo : (NAV[u.rol] ? u.rol : 'administrador');
  const active = state.view === 'proyecto' ? HOME[navKey] : state.view;

  $app().innerHTML = `
  <div class="shell">
    <aside class="sidebar">
      <div class="side-brand"><img src="${LOGO}" alt="UCC"><div><strong>SITP</strong><small>Universidad Cooperativa de Colombia</small></div></div>
      <div class="side-role-box">
        <p class="side-label">${ROLES[rolActivo]?.label || ROLES[u.rol]?.label || ''}</p>
        ${RoleSwitcher(rolActivo, onSwitchRol)}
      </div>
      <nav>${(NAV[navKey] || NAV[u.rol] || []).map(([k, l, i]) =>
        `<button class="nav-item ${active === k ? 'active' : ''}" data-nav="${k}">${Icon(i)}<span>${l}</span></button>`
      ).join('')}</nav>
      <div class="side-user">
        <div class="avatar light">${initials(u.nombre)}</div>
        <div class="who"><strong>${esc(u.nombre)}</strong><small>${esc(u.email)}</small></div>
        <button class="icon-btn" id="logout" title="Cerrar sesión" aria-label="Cerrar sesión">${Icon('out')}</button>
      </div>
    </aside>
    <main class="content" id="content">${content}</main>
  </div>`;

  $app().querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => navigate(b.dataset.nav)));
  document.getElementById('logout').addEventListener('click', onLogout);

  // Role Switcher toggle
  const btn = document.getElementById('roleSwitcherBtn');
  const menu = document.getElementById('roleMenu');
  if (btn && menu) {
    btn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!document.getElementById('roleSwitcher')?.contains(e.target)) menu.hidden = true;
    }, { once: true });
    menu.querySelectorAll('[data-swap-rol]').forEach((opt) =>
      opt.addEventListener('click', () => {
        menu.hidden = true;
        if (onSwitchRol) onSwitchRol(opt.dataset.swapRol);
      })
    );
  }
}

