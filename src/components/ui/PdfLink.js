// <PdfLink/>: botón que abre un PDF protegido (se pide con el token de la sesión).
import { api } from '../../services/api.js';
import { esc } from '../../utils/format.js';
import { Icon } from './Icon.js';
import { toast } from './Toast.js';

export const PdfLink = (path, name, label = 'Ver PDF') => `<button class="link small pdf" data-pdf="${esc(path)}" data-name="${esc(name)}">${Icon('file')}${esc(label)}</button>`;

export async function openPdf(path, name) {
  const w = window.open('', '_blank');
  try {
    const url = URL.createObjectURL(await api.file(path));
    if (w) w.location.href = url; else Object.assign(document.createElement('a'), { href: url, download: name }).click();
  } catch (e) { w?.close(); toast(e.message, true); }
}
export const bindPdfLinks = (root) => root.querySelectorAll('[data-pdf]').forEach((b) => b.addEventListener('click', () => openPdf(b.dataset.pdf, b.dataset.name)));
