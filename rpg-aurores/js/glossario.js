/* ═══════════════════════════════════════════════════════════════
   GLOSSÁRIO — filtro de busca
═══════════════════════════════════════════════════════════════ */

function filtrarGlossario(query) {
  const q = query.trim().toLowerCase();
  const entries = document.querySelectorAll('#glossario-content .gloss-entry');
  const categories = document.querySelectorAll('#glossario-content .gloss-category');
  let totalVisible = 0;

  entries.forEach(entry => {
    const text = entry.textContent.toLowerCase();
    const show = !q || text.includes(q);
    entry.style.display = show ? '' : 'none';
    if (show) totalVisible++;
  });

  categories.forEach(cat => {
    const visibleEntries = [...cat.querySelectorAll('.gloss-entry')].some(e => e.style.display !== 'none');
    cat.style.display = visibleEntries ? '' : 'none';
  });

  let noResult = document.getElementById('gloss-no-result');
  if (totalVisible === 0) {
    if (!noResult) {
      noResult = document.createElement('p');
      noResult.id = 'gloss-no-result';
      noResult.className = 'gloss-no-result';
      noResult.textContent = 'Nenhum termo encontrado. Tente outra palavra-chave.';
      document.getElementById('glossario-content').appendChild(noResult);
    }
    noResult.style.display = '';
  } else if (noResult) {
    noResult.style.display = 'none';
  }
}
