// Notificación temporal en la esquina.
export function toast(msg, error = false) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = `show ${error ? 'error' : ''}`;
  clearTimeout(t._t); t._t = setTimeout(() => (t.className = ''), 3000);
}
