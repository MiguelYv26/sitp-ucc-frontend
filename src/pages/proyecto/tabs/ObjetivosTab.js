// Pestaña «Objetivos»: cada objetivo con su versión actual y las anteriores.
import { Select, Tag } from '../../../components/ui/Badges.js';
import { is, mat } from '../../../store/state.js';
import { esc, fdate } from '../../../utils/format.js';

function ObjetivoItem(o) {
  const cur = o.versiones.at(-1);
  const old = o.versiones.slice(0, -1).reverse().map((v) => `<div class="ver">${Tag(`v${v.v} · ${mat(v.curso)}`)}<p>${esc(v.texto)}</p><p class="small muted">${esc(v.motivo)} · ${esc(v.autor.nombre)} · ${fdate(v.fecha)}</p></div>`).join('');
  return `<article class="item">
    <div class="c-head">${Tag(o.tipo, o.tipo === 'General' ? 'teal' : '')}${Tag(`v${cur.v} · ${mat(cur.curso)}`)}<time>${fdate(cur.fecha)}</time></div>
    <p class="obj-text">${esc(cur.texto)}</p><p class="small muted">${esc(cur.motivo)} · ${esc(cur.autor.nombre)}</p>
    ${o.versiones.length > 1 ? `<details><summary>${o.versiones.length - 1} versión(es) anterior(es)</summary>${old}</details>` : ''}</article>`;
}

export const ObjetivosTab = {
  label: 'Objetivos', items: (p) => p.objetivos,
  filters: () => [{ key: 'tipo', label: 'Tipo', options: [['General', 'General'], ['Específico', 'Específico']], get: (o) => o.tipo }],
  create: (p) => is('estudiante', 'asesor_metodologico') && { kind: 'objetivo', label: 'Nueva versión', html: `<div class="row">
      ${Select('objetivoId', [['', 'Nuevo objetivo'], ...p.objetivos.map((o, i) => [o.id, `${o.tipo} ${i + 1} · ${o.versiones.at(-1).texto.slice(0, 50)}…`])], 'Objetivo')}
      ${Select('tipo', [['Específico', 'Específico'], ['General', 'General']], 'Tipo (si es nuevo)')}</div>
      <label>Redacción<textarea name="texto" rows="2" required minlength="10"></textarea></label>
      <label>Motivo del cambio<input name="motivo" placeholder="Ej.: ajuste de alcance acordado en el Acta N.º 02"></label>` },
  list: (items) => items.map(ObjetivoItem).join(''),
};
