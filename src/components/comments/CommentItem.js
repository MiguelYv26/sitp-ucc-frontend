// <CommentItem/>: un comentario con autor, rol y fecha.
import { esc, fdate } from '../../utils/format.js';
import { Avatar, RoleBadge } from '../ui/Badges.js';

export const CommentItem = (c, withProject = false, about = '') => `<article class="comment">
    ${Avatar(c.autor)}
    <div class="c-body"><div class="c-head"><strong>${esc(c.autor.nombre)}</strong>${RoleBadge(c.autor.rol)}<time>${fdate(c.fecha)}</time></div>
    ${withProject ? `<button class="link small" data-go-project="${c.proyectoId}">${esc(c.proyecto)}</button>` : ''}
    ${about ? `<p class="small muted">Sobre: ${esc(about)}</p>` : ''}<p>${esc(c.texto)}</p></div></article>`;
