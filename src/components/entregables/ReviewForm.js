// <ReviewForm/>: formulario de revisión (el técnico comenta; el metodológico califica).
import { ESTADOS_ENT } from '../../constants/index.js';
import { actaOpts, entLabel } from '../../store/selectors.js';
import { is } from '../../store/state.js';
import { esc } from '../../utils/format.js';
import { Select } from '../ui/Badges.js';

export function ReviewForm(p, e) {
  const met = is('asesor_metodologico');
  return `<details class="rev-form"><summary>Registrar revisión de ${esc(entLabel(e))}</summary>
    <form class="form" data-review="${e.id}"><div class="row">${Select('actaId', actaOpts(p), 'Acta relacionada', p.actas[0]?.id ?? '')}
      ${met ? `<div class="row"><label>Estado<select name="estado">${ESTADOS_ENT.slice(1).map((s) => `<option>${s}</option>`).join('')}</select></label>
        <label>Nota (0 a 5)<input name="nota" type="number" min="0" max="5" step="0.1"></label></div>` : '<p class="small muted">El asesor técnico no califica. Si escribes observaciones o correcciones se genera un PDF vinculado al acta.</p>'}</div>
      <div class="row"><label>${met ? 'Observaciones' : 'Comentarios y sugerencias'}<textarea name="observaciones" rows="2"></textarea></label>
        <label>Correcciones que debe hacer el estudiante<textarea name="correcciones" rows="2"></textarea></label></div>
      <div class="row-end"><button class="btn sm">Guardar revisión</button></div></form></details>`;
}
