// Comportamiento compartido entre páginas: abrir un proyecto desde una fila o tarjeta.
import { navigate } from '../core/router.js';

export const openProject = (id) => navigate('proyecto', { projectId: Number(id), tab: 'info', openForm: null });
export function bindOpen(root) {
  root.querySelectorAll('[data-open]').forEach((r) => {
    r.addEventListener('click', () => openProject(r.dataset.open));
    r.addEventListener('keydown', (e) => e.key === 'Enter' && openProject(r.dataset.open));
  });
  root.querySelectorAll('[data-go-project]').forEach((b) => b.addEventListener('click', () => openProject(b.dataset.goProject)));
}
