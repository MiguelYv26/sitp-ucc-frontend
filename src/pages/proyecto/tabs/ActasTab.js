// Pestaña «Actas»: actas con firma del metodológico, compromisos y revisiones vinculadas.
import { materiaFilter } from '../../../components/filters/FilterBar.js';
import { Icon } from '../../../components/ui/Icon.js';
import { Pill, RoleBadge, Tag } from '../../../components/ui/Badges.js';
import { confirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { PdfLink } from '../../../components/ui/PdfLink.js';
import { toast } from '../../../components/ui/Toast.js';
import { REVISOR } from '../../../constants/index.js';
import { api } from '../../../services/api.js';
import { is, mat } from '../../../store/state.js';
import { esc, fdate, fileName, pad } from '../../../utils/format.js';
import { abierto, commentsLink, entLabel } from '../../../store/selectors.js';

const hoy = () => new Date().toISOString().slice(0, 10);

const Compromiso = (k, edit) => {
  const vencido = !k.cumplido && k.fechaLimite < hoy();
  return `<tr class="${vencido ? 'late' : ''}"><td>${edit ? `<input type="checkbox" data-cumplido="${k.id}" ${k.cumplido ? 'checked' : ''} aria-label="Marcar cumplido">` : k.cumplido ? '✓' : '·'}</td>
    <td class="${k.cumplido ? 'done' : ''}">${esc(k.descripcion)}</td><td>${esc(k.responsable)}</td>
    <td>${fdate(k.fechaLimite)}${vencido ? ' <b>Vencido</b>' : ''}</td></tr>`;
};

function ActaItem(d, p) {
  const revs = p.revisiones.filter((r) => r.actaId === d.id);
  const edit = abierto(p) && is('estudiante', 'asesor_tecnico', 'asesor_metodologico');
  const revItem = (r) => {
    const e = p.entregables.find((x) => x.id === r.entregableId);
    return `<li>${RoleBadge(REVISOR[r.tipo])} ${esc(entLabel(e))} ${Pill(r.estado)}${r.pdf ? ' ' + PdfLink(`/revisiones/${r.id}/pdf`, fileName(r.pdf), 'PDF de observaciones') : ''}</li>`;
  };
  return `<article class="item acta"><div class="acta-n">N.º ${pad(d.numero)}</div><div class="ent-main">
    <div class="c-head">${Tag(mat(d.curso), 'teal')}${RoleBadge(d.autor.rol)}<time>${fdate(d.fecha)}</time>
      ${d.firmada ? `${Pill('Firmada')}<span class="small muted">por ${esc(d.firmante)} · ${fdate(d.firmadaEn)}</span>` : Pill('Pendiente de firma')}
      ${!d.firmada && is('asesor_metodologico') ? `<button class="btn sm lime" data-firmar="${d.id}">Validar firma</button>` : ''}</div>
    <p><b>Temas:</b> ${esc(d.temas)}</p>
    ${d.compromisos.length ? `<table class="ktable"><thead><tr><th></th><th>Compromiso</th><th>Responsable</th><th>Fecha límite</th></tr></thead><tbody>${d.compromisos.map((k) => Compromiso(k, edit)).join('')}</tbody></table>` : '<p class="small muted">Sin compromisos registrados.</p>'}
    ${revs.length ? `<p class="small"><b>Revisiones vinculadas:</b></p><ul class="links">${revs.map(revItem).join('')}</ul>` : ''}
    <p class="small muted">${esc(d.autor.nombre)} · ${commentsLink(p, 'acta', d.id)}</p></div></article>`;
}

const FilaCompromiso = () => `<div class="row k-row"><label>Compromiso<input name="c_desc" maxlength="300" placeholder="Qué se debe hacer"></label>
  <label>Responsable<input name="c_resp" maxlength="120"></label><label>Fecha límite<input name="c_fecha" type="date" min="${hoy()}"></label></div>`;

export const ActasTab = {
  label: 'Actas', items: (p) => p.actas,
  filters: () => [materiaFilter((a) => a.curso), { key: 'firma', label: 'Firma', options: [['1', 'Firmada'], ['0', 'Pendiente de firma']], get: (a) => (a.firmada ? '1' : '0') }],
  create: (p) => abierto(p) && is('asesor_tecnico', 'asesor_metodologico') && { kind: 'acta', label: `Nueva acta N.º ${pad(p.actas.length + 1)}`, html: `<div class="row"><label>Fecha<input name="fecha" type="date" value="${hoy()}"></label><span></span></div>
      <label>Temas tratados<textarea name="temas" rows="2" required minlength="3"></textarea></label>
      <fieldset class="k-box"><legend>Compromisos</legend><div id="kRows">${FilaCompromiso()}</div>
      <button type="button" class="btn ghost sm" data-add-row="#kRows">${Icon('plus')}Otro compromiso</button></fieldset>` },
  list: (items, p) => items.map((d) => ActaItem(d, p)).join(''),
  bind: (body, p, { reload }) => {
    body.querySelectorAll('[data-firmar]').forEach((b) => b.addEventListener('click', async () => {
      if (!await confirmDialog('Validar firma del acta', 'El acta quedará firmada con tu nombre y la fecha de hoy. Esta acción no se puede deshacer.')) return;
      try { await api.firmar(b.dataset.firmar); toast('Acta firmada'); await reload(); } catch (e) { toast(e.message, true); }
    }));
    body.querySelectorAll('[data-cumplido]').forEach((c) => c.addEventListener('change', async () => {
      try { await api.compromiso(c.dataset.cumplido, c.checked); toast(c.checked ? 'Compromiso cumplido' : 'Compromiso pendiente'); await reload(); } catch (e) { c.checked = !c.checked; toast(e.message, true); }
    }));
  },
};
