// Enrutador mínimo: las páginas llaman navigate() y App decide qué renderizar.
let handler = () => {};
export const setNavigator = (fn) => { handler = fn; };
export const navigate = (view, opts = {}) => handler(view, opts);
