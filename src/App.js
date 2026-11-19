// <App/>: decide qué página mostrar según el estado (login, panel, proyectos o proyecto).
import { Layout } from './components/layout/Layout.js';
import { Empty } from './components/ui/Badges.js';
import { toast } from './components/ui/Toast.js';
import { $content } from './core/dom.js';
import { setNavigator } from './core/router.js';
import { LoginPage } from './pages/LoginPage.js';
import { AdminPage } from './pages/AdminPage.js';
import { PanelPage } from './pages/PanelPage.js';
import { ProyectoPage } from './pages/proyecto/ProyectoPage.js';
import { ProyectosPage } from './pages/ProyectosPage.js';
import { api, hasToken, setToken } from './services/api.js';
import { setState, state, hasMultipleRoles, userRoles } from './store/state.js';

const LOADING = '<div class="loading"><div class="sk"></div><div class="sk tall"></div></div>';

// Vista home depende de si el usuario es admin o tiene solo un rol simple
const home = (u) => ((u.roles || []).includes('administrador') || u.rol === 'administrador' ? 'admin' : 'panel');

function showLogin() {
  LoginPage((user) => {
    // Sincronizar rolActivo desde la respuesta del login
    setState({ user, view: 'panel', filters: {}, projectId: null, rolActivo: user.rolActivo || user.rol });
    go(home(user));
  });
}

async function logout() {
  try { await api.logout(); } catch { /* sesión ya cerrada */ }
  setToken(null); setState({ user: null, panel: null, project: null, rolActivo: null }); showLogin();
}

function handleError(e) {
  if (e.status === 401) { setToken(null); state.user = null; showLogin(); return toast('Tu sesión expiró. Ingresa de nuevo.', true); }
  $content().innerHTML = Empty(e.message);
}

// Role Switcher: cambia el rol activo y recarga el panel
export async function switchRol(nuevoRol) {
  try {
    await api.switchRol(nuevoRol);
    state.rolActivo = nuevoRol;
    state.panel = null; // fuerza recarga
    go(nuevoRol === 'administrador' ? 'admin' : 'panel');
  } catch (e) { toast(e.message, true); }
}

async function go(view, opts = {}) {
  setState({ view, ...opts });
  Layout(LOADING, logout, switchRol);
  try {
    if (view !== 'proyecto' || !state.panel) state.panel = await api.panel();
    const mios = state.panel.proyectos;
    if (view === 'panel' && state.rolActivo === 'estudiante' && mios.length === 1) return go('proyecto', { projectId: mios[0].id, tab: 'info' });
    if (view === 'panel') return PanelPage();
    if (view === 'admin') {
      const [usuarios, catalogos] = await Promise.all([api.usuarios(), api.catalogos()]);
      state.admin = { usuarios, catalogos };
      return AdminPage();
    }
    if (view === 'proyectos') return ProyectosPage();
    if (!state.projectId) return go('proyectos');
    state.project = await api.proyecto(state.projectId);
    ProyectoPage();
  } catch (e) { handleError(e); }
}

export async function App() {
  setNavigator(go);
  if (!hasToken()) return showLogin();
  try {
    const me = await api.me();
    state.user = me.user;
    state.rolActivo = me.user.rolActivo || me.user.rol;
    go(home(state.user));
  } catch { setToken(null); showLogin(); }
}

