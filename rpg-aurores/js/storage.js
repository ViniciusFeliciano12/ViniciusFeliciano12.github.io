/* ═══════════════════════════════════════════════════════════════
   STORAGE — persistência localStorage + Firestore
═══════════════════════════════════════════════════════════════ */

const STORAGE_KEY = 'hp_auror_fichas_v3';
let fichas = [];
let abaAtiva = null;
let tabParaDeletar = null;
let modalItensId = null;

// Snapshot do último estado confirmado no Firestore para cada ficha.
// Permite calcular o diff e enviar apenas os campos que mudaram.
const _lastSaved = {};


function sincronizarLastSaved(fichaId, dados, nome) {
  _lastSaved[fichaId] = { nome, dados: JSON.parse(JSON.stringify(dados || {})) };
}

function _calcDiff(fichaId, newDados, newNome) {
  const prev = _lastSaved[fichaId] || {};
  const prevDados = prev.dados || {};
  const prevNome = prev.nome ?? null;
  const diffDados = {};

  for (const key of Object.keys(newDados)) {
    const nv = newDados[key];
    const ov = prevDados[key];
    const changed = (typeof nv === 'object' || typeof ov === 'object')
      ? JSON.stringify(nv) !== JSON.stringify(ov)
      : nv !== ov;
    if (changed) diffDados[key] = nv;
  }

  // Campos removidos do dados local devem ser deletados do Firestore
  for (const key of Object.keys(prevDados)) {
    if (!(key in newDados)) diffDados[key] = null;
  }

  return { diffDados, nomeNovo: newNome !== prevNome ? newNome : null };
}

function carregarFichas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) fichas = JSON.parse(raw);
  } catch (e) { fichas = []; }
  if (!fichas.length) fichas = [{ id: gerarFichaId('Personagem 1'), nome: 'Personagem 1', dados: {} }];
}

function salvarFichas(fichaId) {
  if (typeof _modoLeitura !== 'undefined' && _modoLeitura) return;
  if (typeof DB_USER !== 'undefined' && DB_USER) {
    const lista = fichaId ? [getFicha(fichaId)].filter(Boolean) : fichas;
    lista.forEach(f => {
      const { diffDados, nomeNovo } = _calcDiff(f.id, f.dados || {}, f.nome);
      if (Object.keys(diffDados).length === 0 && nomeNovo === null) return;
      dbSaveCampos(f.id, nomeNovo, diffDados)
        .then(() => sincronizarLastSaved(f.id, f.dados, f.nome))
        .catch(e => {
          console.error('[salvarFichas]', e);
          const msg = e?.code === 'permission-denied' ? 'Sem permissão para salvar.' :
                      e?.code === 'resource-exhausted' ? 'Documento muito grande (reduza o tamanho da foto).' :
                      'Erro ao salvar. Verifique sua conexão.';
          if (typeof mostrarToast === 'function') mostrarToast('⚠ ' + msg);
        });
    });
  } else {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(fichas)); }
    catch (e) { console.warn('Erro ao salvar local:', e); }
  }
}

function getFicha(id) { return fichas.find(f => f.id === id); }

const _CAMPOS_DB = ['lastEditedBy', 'campanhaId', 'updatedAt', 'userId'];

function _limparCamposDB(ficha) {
  const copia = { ...ficha };
  _CAMPOS_DB.forEach(k => delete copia[k]);
  return copia;
}

function exportarFichas() {
  if (abaAtiva) coletarDados(abaAtiva);
  const json = JSON.stringify(fichas.map(_limparCamposDB), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `fichas_auror_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
  mostrarToast('✓ Fichas exportadas');
}

document.getElementById('import-file-input').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const importadas = JSON.parse(ev.target.result);
      if (!Array.isArray(importadas) || !importadas[0]?.id) throw new Error('formato inválido');
      importadas.forEach((f, i) => {
        _CAMPOS_DB.forEach(k => delete f[k]);
        if (fichas.some(ex => ex.id === f.id)) f.id = gerarFichaId(f.nome || 'personagem');
      });
      fichas.push(...importadas);
      salvarFichas();
      abaAtiva = importadas[0].id;
      renderConteudo();
      renderTabs();
      mostrarToast(`✓ ${importadas.length} ficha(s) importada(s)`);
    } catch (err) {
      mostrarToast('✗ Arquivo inválido');
    }
  };
  reader.readAsText(file);
  this.value = '';
});
