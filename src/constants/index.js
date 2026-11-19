// Constantes compartidas por toda la interfaz.
// Roles globales: estudiante, docente, administrador. Roles contextuales del docente (según el proyecto): técnico, metodológico, jurado.
export const ROLES = {
  estudiante: { label: 'Estudiante', css: 'est' },
  asesor_tecnico: { label: 'Asesor técnico', css: 'tec' },
  asesor_metodologico: { label: 'Asesor metodológico', css: 'met' },
  jurado: { label: 'Jurado', css: 'jur' },
  docente: { label: 'Docente', css: 'doc' },
  administrador: { label: 'Administrador', css: 'adm' },
};
export const ROL_PROYECTO = ['asesor_tecnico', 'asesor_metodologico', 'jurado'];
export const ESTADOS_ENT = ['Entregado', 'Revisado', 'Para corrección', 'Aprobado'];
export const REVISOR = { tecnica: 'asesor_tecnico', metodologica: 'asesor_metodologico' };
export const CONCEPTOS = ['Aprobado', 'Observado / Plan de mejora'];
export const LOGO = 'public/img/logo-ucc.png';
