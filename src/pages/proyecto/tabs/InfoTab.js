// Pestaña «Información del proyecto»: datos, participantes y entregables E1/E2.
import { EntregableCard } from '../../../components/entregables/EntregableCard.js';
import { materiaFilter } from '../../../components/filters/FilterBar.js';
import { Avatar, Pill, Select } from '../../../components/ui/Badges.js';
import { Icon } from '../../../components/ui/Icon.js';
import { ESTADOS_ENT } from '../../../constants/index.js';
import { is, state } from '../../../store/state.js';
import { esc, fdate } from '../../../utils/format.js';
import { abierto, entregablesDe, estadoEnt } from '../../../store/selectors.js';

const Person = (u) => `<div class="person">${Avatar(u)}<div><strong>${esc(u.nombre)}</strong><small class="muted">${esc(u.email)}</small></div></div>`;

function intro(p) {
  const canEdit = abierto(p) && is('estudiante', 'asesor_metodologico');
  const alerta = p.compromisosPendientes && abierto(p) ? `<div class="alert" role="status">${Icon('alert')}<span>Hay <b>${p.compromisosPendientes}</b> compromiso(s) de acta pendiente(s).</span><button class="link" data-tab-go="actas">Ver actas</button></div>` : '';
  return `${alerta}<div class="info-grid pad">
    <section><h3>Información del proyecto</h3><dl class="dl">
      <dt>Título</dt><dd>${esc(p.titulo)}</dd><dt>Programa</dt><dd>${esc(p.programa)}</dd><dt>Grupo</dt><dd>${esc(p.grupo)}</dd>
      <dt>Materia actual</dt><dd>${esc(p.curso)}</dd><dt>Estado</dt><dd>${Pill(p.estado)}</dd><dt>Registrado</dt><dd>${fdate(p.creado)}</dd>
      <dt>Actas</dt><dd>${p.actas.length}</dd></dl>
      ${canEdit ? `<div class="row-start"><button class="btn ghost sm" data-edit>Editar información</button>${is('asesor_metodologico') ? '<button class="btn ghost sm danger" data-cancel-proj>Cancelar proyecto</button>' : ''}</div>` : ''}</section>
    <section class="people"><h3>Estudiantes</h3>${p.estudiantesInfo.map(Person).join('')}
      <h3>Asesor técnico</h3>${Person(p.asesorTecnico)}<h3>Asesor metodológico</h3>${Person(p.asesorMetodologico)}${p.jurado ? `<h3>Jurado</h3>${Person(p.jurado)}` : ''}</section></div>
    <h3 class="sec-title">Entregables</h3>`;
}

export const InfoTab = {
  label: 'Información del proyecto', items: entregablesDe, intro,
  filters: () => [
    materiaFilter((d) => d.curso),
    { key: 'estado', label: 'Estado', options: ['Pendiente', ...ESTADOS_ENT].map((s) => [s, s]), get: estadoEnt },
    { key: 'rev', label: 'Revisiones de', options: [['tecnica', 'Asesor técnico'], ['metodologica', 'Asesor metodológico']], match: (d, v) => d.revs.some((r) => r.tipo === v) },
  ],
  create: (p) => is('estudiante') && abierto(p) && { kind: 'entregable', label: 'Subir PDF de entregable', html: `<div class="row">
      ${Select('defId', p.catalogo.filter((d) => d.curso === p.cursoActual).map((d) => [d.id, `${d.codigo} · ${d.nombre}`]), `Entregable de ${esc(p.curso)}`)}
      <label>Archivo PDF<input name="archivo" type="file" accept="application/pdf,.pdf" required></label></div>
      <label>Descripción (opcional)<input name="descripcion" maxlength="1000" placeholder="Qué cambió en esta versión"></label>
      <p class="small muted">El archivo se renombra solo con el grupo, la materia, el entregable y la versión (ej.: G${esc(p.grupo)}_M${p.cursoActual}_E1_…_v2.pdf).</p>` },
  list: (items, p) => items.map((d) => EntregableCard(p, d, (state.filters.info || {}).rev)).join(''),
};
