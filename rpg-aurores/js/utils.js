/* ═══════════════════════════════════════════════════════════════
   UTILS — helpers globais reutilizáveis
═══════════════════════════════════════════════════════════════ */

function gerarId() { return 'f' + Date.now() + Math.random().toString(36).slice(2, 6); }

function gerarFichaId(nome) {
  const slug = (nome || 'personagem')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 32) || 'personagem';
  return 'ficha_' + slug + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

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
