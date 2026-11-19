// Selectores: derivan datos del proyecto para las pestañas (como hooks/selectors de React).
import { esc, fdate, pad } from '../utils/format.js';

export const abierto = (p) => p.estado === 'En curso';
export const entLabel = (e) => `${e.codigo} · ${e.titulo} v${e.version}`;
export const refLabel = (p, sobre, id) => sobre === 'entregable' ? entLabel(p.entregables.find((e) => e.id === id) || { codigo: '', titulo: 'Entregable', version: '' })
  : sobre === 'acta' ? `Acta N.º ${pad(p.actas.find((a) => a.id === id)?.numero ?? '')}` : 'Proyecto en general';
export const refOptions = (p) => [['proyecto:', 'Proyecto en general'], ...p.entregables.map((e) => [`entregable:${e.id}`, `Entregable · ${entLabel(e)}`]), ...p.actas.map((a) => [`acta:${a.id}`, `Acta N.º ${pad(a.numero)}`])];
export const feed = (p) => [...p.historial.map((h) => ({ ...h, kind: 'evento' })), ...p.comentarios.map((c) => ({ ...c, kind: 'comentario', tipo: 'Comentario' }))]
  .sort((a, b) => b.fecha.localeCompare(a.fecha));
const commentCount = (p, sobre, id) => p.comentarios.filter((c) => c.sobre === sobre && c.sobreId === id).length;
export const commentsLink = (p, sobre, id) => `<button class="link small" data-ref="${esc(sobre)}:${id}">${commentCount(p, sobre, id)} comentario(s)</button>`;
// Cada entregable del catálogo (E1, E2…) con sus versiones (PDF) y revisiones
export const entregablesDe = (p) => p.catalogo.filter((d) => d.curso <= p.cursoActual).map((d) => {
  const versiones = p.entregables.filter((e) => e.defId === d.id).sort((a, b) => b.version - a.version);
  const ids = versiones.map((v) => v.id);
  return { ...d, versiones, ultima: versiones[0], revs: p.revisiones.filter((r) => ids.includes(r.entregableId)) };
}).sort((a, b) => b.curso - a.curso || a.codigo.localeCompare(b.codigo));
export const estadoEnt = (d) => d.ultima ? d.ultima.estado : 'Pendiente';
export const actaOpts = (p) => [['', 'Sin acta'], ...p.actas.map((a) => [a.id, `Acta N.º ${pad(a.numero)} · ${fdate(a.fecha)}`])];
// Pendiente principal del proyecto según el rol del usuario en él (indicador de las tarjetas)
export function pendiente(p) {
  if (p.estado !== 'En curso') return '';
  if (p.miRol === 'jurado') return p.concepto ? '' : 'Evaluación del jurado pendiente';
  if (p.miRol === 'estudiante') return p.compromisosPendientes ? `${p.compromisosPendientes} compromiso(s) pendiente(s)` : '';
  if (p.miRol === 'asesor_metodologico' && p.actasSinFirma) return `${p.actasSinFirma} acta(s) por firmar`;
  return p.porRevisar ? `${p.porRevisar} entregable(s) por revisar` : '';
}
export const observado = (p) => p.paraCorreccion > 0 || p.concepto === 'Observado / Plan de mejora';
export const estadoProyecto = (p) => p.estado !== 'En curso' ? p.estado : p.paraCorreccion ? 'Para corrección' : p.porRevisar ? 'Por revisar' : 'Al día';
