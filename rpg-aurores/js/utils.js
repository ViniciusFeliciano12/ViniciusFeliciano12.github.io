/* ═══════════════════════════════════════════════════════════════
   UTILS — helpers globais reutilizáveis
═══════════════════════════════════════════════════════════════ */

function gerarId() { return 'f' + Date.now() + Math.random().toString(36).slice(2, 6); }

let toastTimer = null;
function mostrarToast(msg) {
  const t = document.getElementById('save-toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => { fn.apply(this, args); mostrarToast('✓ Ficha salva'); }, ms);
  };
}
