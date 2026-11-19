// Pestaña «Historial»: movimientos + comentarios agrupados por materia.
import { CommentItem } from '../../../components/comments/CommentItem.js';
import { materiaFilter } from '../../../components/filters/FilterBar.js';
import { Select } from '../../../components/ui/Badges.js';
import { ROLES } from '../../../constants/index.js';
import { is, mat } from '../../../store/state.js';
import { esc, fdate, ftime } from '../../../utils/format.js';
import { feed, refLabel, refOptions } from '../../../store/selectors.js';

const Evento = (x) => `<li><span class="dot"></span><div><div class="c-head"><strong>${esc(x.tipo)}</strong><time>${fdate(x.fecha)} · ${ftime(x.fecha)}</time></div>
  <p>${esc(x.detalle)}</p><p class="small muted">${esc(x.autor.nombre)} · ${ROLES[x.autor.rol]?.label || ''}</p></div></li>`;
const Comentario = (x, p) => `<li class="is-com"><span class="dot"></span>${CommentItem(x, false, x.sobre !== 'proyecto' ? refLabel(p, x.sobre, x.sobreId) : '')}</li>`;

export const HistorialTab = {
  label: 'Historial', items: feed,
  filters: (p) => [
    materiaFilter((x) => x.curso),
    { key: 'tipo', label: 'Acción', options: [...new Set(feed(p).map((x) => x.tipo))].map((t) => [t, t]), get: (x) => x.tipo },
    // El asesor metodológico no ve el filtro de autores
    ...(is('asesor_metodologico') ? [] : [{ key: 'rol', label: 'Autor', options: Object.entries(ROLES).map(([k, v]) => [k, v.label]), get: (x) => x.autor.rol }]),
    { key: 'ref', label: 'Sobre', options: refOptions(p), get: (x) => x.kind === 'comentario' ? `${x.sobre}:${x.sobreId ?? ''}` : '' },
  ],
  create: (p) => is('estudiante', 'asesor_tecnico', 'asesor_metodologico') && ({ kind: 'comentario', fixed: true, label: 'Publicar comentario', html: `<div class="row compact">${Select('ref', refOptions(p), 'Sobre')}
      <label>Comentario<textarea name="texto" rows="1" required placeholder="Visible para ambos asesores y los estudiantes"></textarea></label></div>` }),
  list: (items, p) => [3, 2, 1].filter((n) => items.some((x) => x.curso === n)).map((n) => `<h3 class="group-h">${esc(mat(n))}</h3><ol class="timeline">${items.filter((x) => x.curso === n).map((x) => x.kind === 'comentario' ? Comentario(x, p) : Evento(x)).join('')}</ol>`).join(''),
};
