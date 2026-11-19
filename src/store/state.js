// Estado global de la aplicación (equivalente a un Context/Store de React).
export const state = {
  user: null, view: 'panel', projectId: null, tab: 'info', openGroups: new Set(),
  panel: null, project: null, admin: null, adminTab: 'usuarios', filters: {}, openForm: null,
  // rolActivo: rol seleccionado con el Role Switcher (null = usa user.roles[0] o user.rol)
  rolActivo: null,
};
export const setState = (patch) => Object.assign(state, patch);
// Dentro de un proyecto se usa el rol contextual (miRol); fuera, el rolActivo elegido o el rol global
export const rol = () => {
  if (state.view === 'proyecto' && state.project) return state.project.miRol;
  return state.rolActivo || state.user?.rol;
};
export const is = (...roles) => roles.includes(rol());
// Materias: nombres reales que llegan de la base de datos (tabla materias)
export const materias = () => state.project?.cursos || state.panel?.cursos || {};
export const mat = (n) => materias()[n] || '';
// Helpers multi-rol
export const userRoles = () => state.user?.roles || (state.user?.rol ? [state.user.rol] : []);
export const isAdmin = () => state.user?.rol === 'administrador' || (state.user?.roles || []).includes('administrador');
export const hasMultipleRoles = () => userRoles().length > 1 || isAdmin();
