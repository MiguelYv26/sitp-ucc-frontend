// Diálogo único: confirma (sin campos) o devuelve los datos de un formulario corto (con campos).
import { esc } from '../../utils/format.js';

export function confirmDialog(title, text, fields = '') {
  return new Promise((resolve) => {
    const d = document.createElement('div');
    d.className = 'modal-bg';
    d.innerHTML = `<form class="modal form" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(text)}</p>${fields}
      <div class="row-end"><button type="button" class="btn ghost" data-r="0">Cancelar</button><button class="btn">Confirmar</button></div></form>`;
    const f = d.querySelector('form');
    f.addEventListener('submit', (e) => { e.preventDefault(); d.remove(); resolve(fields ? Object.fromEntries(new FormData(f)) : true); });
    d.querySelector('[data-r]').addEventListener('click', () => { d.remove(); resolve(null); });
    document.body.append(d);
    f.querySelector('input, textarea')?.focus();
  });
}
