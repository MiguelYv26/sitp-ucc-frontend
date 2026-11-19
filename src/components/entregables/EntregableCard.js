// <EntregableCard/>: un entregable (E1, E2...) con sus versiones PDF y revisiones.
import { abierto, commentsLink, estadoEnt } from '../../store/selectors.js';
import { is, mat } from '../../store/state.js';
import { esc, fdate, fileName } from '../../utils/format.js';
import { Pill, Tag } from '../ui/Badges.js';
import { PdfLink } from '../ui/PdfLink.js';
import { ReviewForm } from './ReviewForm.js';
import { RevisionItem } from './RevisionItem.js';

export function EntregableCard(p, d, rev) {
  const e = d.ultima, revs = d.revs.filter((r) => !rev || r.tipo === rev);
  const revsOf = (v) => revs.filter((r) => r.entregableId === v.id).map(RevisionItem).join('');
  const verRow = (v) => `<div class="ver-row"><div class="c-head">${Tag('v' + v.version)}${PdfLink(`/entregables/${v.id}/archivo`, fileName(v.archivo), fileName(v.archivo))}<time>${fdate(v.fecha)}</time></div>
    <p class="small muted">${esc(v.autor.nombre)}${v.descripcion ? ` · ${esc(v.descripcion)}` : ''} · ${commentsLink(p, 'entregable', v.id)}</p>${revsOf(v)}</div>`;
  return `<article class="item ent-card ${estadoEnt(d) === 'Para corrección' ? 'warn' : ''}">
    <div class="c-head"><span class="code">${esc(d.codigo)}</span><strong>${esc(d.nombre)}</strong>${Tag(mat(d.curso))}${Pill(estadoEnt(d))}${e?.nota != null ? `<span class="nota">${Number(e.nota).toFixed(1)}</span>` : ''}</div>
    ${e ? verRow(e) + (d.versiones.length > 1 ? `<details><summary>${d.versiones.length - 1} versión(es) anterior(es)</summary>${d.versiones.slice(1).map(verRow).join('')}</details>` : '')
      : `<p class="small muted">${d.curso === p.cursoActual ? 'Aún no se ha subido el PDF.' : 'No se entregó en esta materia.'}</p>`}
    ${e && is('asesor_tecnico', 'asesor_metodologico') && abierto(p) ? ReviewForm(p, e) : ''}</article>`;
}
