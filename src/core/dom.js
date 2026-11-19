// Utilidades de render: contenedores raíz y foco del buscador.
export const $app = () => document.getElementById('app');
export const $content = () => document.getElementById('content');
export function refocus(root) {
  const i = root.querySelector('input[data-f="q"]');
  if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
}
