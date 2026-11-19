// <RevisionItem/>: revisión de un asesor (estado, nota, observaciones y PDF).
import { REVISOR } from '../../constants/index.js';
import { esc, fdate, fileName, pad } from '../../utils/format.js';
import { Pill, RoleBadge, Tag } from '../ui/Badges.js';
import { PdfLink } from '../ui/PdfLink.js';

export const RevisionItem = (r) => `<div class="rev ${r.tipo}"><div class="c-head">${RoleBadge(REVISOR[r.tipo])}${Pill(r.estado)}${r.nota != null ? `<span class="nota">${Number(r.nota).toFixed(1)}</span>` : ''}
    ${r.actaNumero ? Tag(`Acta N.º ${pad(r.actaNumero)}`, 'teal') : ''}<time>${fdate(r.fecha)}</time></div>
    ${r.observaciones ? `<p><b>Observaciones:</b> ${esc(r.observaciones)}</p>` : ''}${r.correcciones ? `<p class="fix"><b>Correcciones:</b> ${esc(r.correcciones)}</p>` : ''}
    <p class="small muted">${esc(r.autor.nombre)}${r.pdf ? ` · ${PdfLink(`/revisiones/${r.id}/pdf`, fileName(r.pdf), 'PDF de observaciones')}` : ''}</p></div>`;
