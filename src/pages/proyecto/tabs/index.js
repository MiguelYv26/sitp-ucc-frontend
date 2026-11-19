// Registro de pestañas del proyecto (orden en que se muestran). visible(p) oculta las que no aplican al rol.
import { ActasTab } from './ActasTab.js';
import { EvaluacionTab } from './EvaluacionTab.js';
import { HistorialTab } from './HistorialTab.js';
import { InfoTab } from './InfoTab.js';
import { ObjetivosTab } from './ObjetivosTab.js';

export const TABS = { info: InfoTab, actas: ActasTab, historial: HistorialTab, objetivos: ObjetivosTab, evaluacion: EvaluacionTab };
