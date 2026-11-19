// Pestaña «Evaluación» (jurado): vista dividida. Izquierda: entregables y objetivos; derecha: rúbrica con total en vivo.
import { Empty, Pill, Tag } from '../../../components/ui/Badges.js';
import { confirmDialog } from '../../../components/ui/ConfirmDialog.js';
import { bindPdfLinks, PdfLink } from '../../../components/ui/PdfLink.js';
import { toast } from '../../../components/ui/Toast.js';
import { CONCEPTOS } from '../../../constants/index.js';
import { api } from '../../../services/api.js';
import { is, mat, state } from '../../../store/state.js';
import { esc, fdate, fileName } from '../../../utils/format.js';
import { abierto, entregablesDe, estadoEnt } from '../../../store/selectors.js';

// Promedio ponderado sobre 5 (misma fórmula que el backend)
const total = (cs, pts) => cs.reduce((s, c) => s + (pts[c.id] ?? 0) * c.peso, 0) / (cs.reduce((s, c) => s + c.peso, 0) || 1);

const Side = (p) => {
  const ents = entregablesDe(p).filter((d) => d.curso === p.cursoActual);
  return `<aside class="split-side"><h3>Entregables de ${esc(p.curso)}</h3>
    ${ents.map((d) => `<div class="qa"><div class="c-head"><strong>${esc(d.codigo)} · ${esc(d.nombre)}</strong>${Pill(estadoEnt(d))}</div>
      ${d.ultima ? PdfLink(`/entregables/${d.ultima.id}/archivo`, fileName(d.ultima.archivo), `Ver v${d.ultima.version}`) : '<span class="small muted">Sin archivo</span>'}</div>`).join('')}
    <h3>Objetivos vigentes</h3>
    ${p.objetivos.length ? p.objetivos.map((o) => `<div class="qa">${Tag(o.tipo, o.tipo === 'General' ? 'teal' : '')}<p class="small">${esc(o.versiones.at(-1).texto)}</p></div>`).join('') : '<p class="small muted">Sin objetivos registrados.</p>'}
  </aside>`;
};

const Criterio = (c, v, edit) => `<div class="crit"><div class="c-head"><strong>${esc(c.nombre)}</strong><span class="tag">${c.peso}%</span></div>
  <p class="small muted">${esc(c.descripcion)}</p>
  <div class="crit-in"><input type="range" min="0" max="5" step="0.5" name="c${c.id}" value="${v ?? 0}" ${edit ? '' : 'disabled'} aria-label="Puntaje de ${esc(c.nombre)}"><output>${(v ?? 0).toFixed(1)}</output></div></div>`;

const Historial = (evs) => evs.length ? `<h3 class="sec-title">Evaluaciones registradas</h3>${evs.map((e) => `<article class="item"><div class="c-head">${Tag(mat(e.curso), 'teal')}${Pill(e.concepto)}<strong>${e.total.toFixed(2)} / 5</strong><time>${fdate(e.fecha)}</time></div>
  <p class="small muted">${esc(e.jurado)}${e.observaciones ? ' · ' + esc(e.observaciones) : ''}</p></article>`).join('')}` : '';

export const EvaluacionTab = {
  label: 'Evaluación', items: (p) => p.evaluaciones,
  visible: (p) => ['jurado', 'administrador'].includes(p.miRol),
  mount(body, p, { reload }) {
    const cs = p.criterios, mine = p.evaluaciones.find((e) => e.curso === p.cursoActual && e.juradoId === state.user.id);
    const edit = is('jurado') && abierto(p), pts = { ...(mine?.puntajes || {}) };
    const concepto = mine?.concepto || '';
    body.innerHTML = `<div class="split pad">${Side(p)}
      <form class="form split-main" id="rubrica" novalidate>
        <div class="card-head flat"><h3>Rúbrica · ${esc(p.curso)}</h3>${mine ? Pill('Evaluado') : Pill('Pendiente')}</div>
        ${cs.map((c) => Criterio(c, pts[c.id], edit)).join('')}
        <fieldset class="concepto"><legend>Concepto</legend>${CONCEPTOS.map((c) => `<label class="radio"><input type="radio" name="concepto" value="${esc(c)}" ${concepto === c ? 'checked' : ''} ${edit ? '' : 'disabled'} required>${esc(c)}</label>`).join('')}</fieldset>
        <label>Observaciones / plan de mejora<textarea name="observaciones" rows="3" maxlength="3000" ${edit ? '' : 'disabled'}>${esc(mine?.observaciones || '')}</textarea>
          <small class="hint" id="obsHint"></small></label>
        ${!edit ? `<p class="small muted">${is('administrador') ? 'Vista de solo lectura para el administrador.' : 'El proyecto no admite cambios.'}</p>` : ''}
      </form>
      <aside class="summary"><p class="small muted">Total ponderado</p><strong id="tot">0.00</strong><span class="small muted">de 5,00</span>
        <div class="bar"><i id="totBar"></i></div><p id="sumConcepto" class="small"></p>
        ${edit ? `<button class="btn block" form="rubrica">${mine ? 'Actualizar evaluación' : 'Guardar evaluación'}</button>${mine ? '<button type="button" class="btn ghost block danger" data-del>Eliminar evaluación</button>' : ''}` : ''}
        ${mine ? `<p class="small muted">Última actualización: ${fdate(mine.fecha)}</p>` : ''}</aside>
    </div><div class="pad">${p.evaluaciones.length ? Historial(p.evaluaciones) : Empty('Aún no hay evaluaciones registradas.')}</div>`;

    const f = body.querySelector('#rubrica'), obs = f.elements.observaciones;
    const refresh = () => {
      cs.forEach((c) => { const i = f.elements[`c${c.id}`]; pts[c.id] = Number(i.value); i.nextElementSibling.textContent = Number(i.value).toFixed(1); });
      const t = total(cs, pts), con = f.elements.concepto.value, observado = con && con !== 'Aprobado';
      body.querySelector('#tot').textContent = t.toFixed(2);
      body.querySelector('#totBar').style.width = `${t * 20}%`;
      body.querySelector('#sumConcepto').innerHTML = con ? Pill(con) : '<span class="muted">Selecciona un concepto</span>';
      obs.required = observado; obs.minLength = observado ? 10 : 0; // validación en línea
      body.querySelector('#obsHint').textContent = observado ? 'Obligatorio con concepto «Observado»: describe el plan de mejora (mín. 10 caracteres).' : '';
    };
    f.addEventListener('input', refresh);
    refresh();
    bindPdfLinks(body);
    f.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      if (!f.elements.concepto.value) return toast('Selecciona un concepto', true);
      if (!f.reportValidity()) return;
      try {
        const r = await api.evaluar(p.id, { puntajes: pts, concepto: f.elements.concepto.value, observaciones: obs.value });
        toast(`Evaluación guardada: ${r.total.toFixed(2)} / 5`); await reload();
      } catch (e) { toast(e.message, true); }
    });
    body.querySelector('[data-del]')?.addEventListener('click', async () => {
      if (!await confirmDialog('Eliminar evaluación', 'Se borrará tu evaluación de esta materia. Queda registro en el historial.')) return;
      try { await api.borrarEvaluacion(mine.id); toast('Evaluación eliminada'); await reload(); } catch (e) { toast(e.message, true); }
    });
  },
};
