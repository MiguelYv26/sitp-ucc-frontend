// <ProjectCard/>: tarjeta de proyecto con el rol del docente en ese proyecto y su pendiente principal.
import { estadoProyecto, pendiente } from '../../store/selectors.js';
import { state } from '../../store/state.js';
import { esc, fdate } from '../../utils/format.js';
import { Pill, RoleBadge, Tag } from '../ui/Badges.js';

export const ProjectCard = (p) => {
  const pend = pendiente(p);
  return `<article class="pcard" data-open="${p.id}" tabindex="0">
  <div class="c-head"><strong>${esc(p.titulo)}</strong>${Pill(estadoProyecto(p))}</div>
  <p class="small">${state.user.rol === 'docente' ? RoleBadge(p.miRol, 'Tu rol: ') + ' ' : ''}${Tag(`G-${p.grupo}`)} ${Tag(p.curso, 'teal')} ${Tag(p.programa)}</p>
  <p class="small muted">Estudiantes: ${esc(p.estudiantesInfo.map((s) => s.nombre).join(', '))}</p>
  <p class="small muted">${p.totalEntregables} entregable(s) · ${p.totalActas} acta(s) · Actualizado ${fdate(p.ultimaActividad)}</p>
  ${pend ? `<p class="pend">${esc(pend)}</p>` : ''}
</article>`;
};
