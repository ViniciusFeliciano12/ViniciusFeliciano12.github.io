/* ═══════════════════════════════════════════════════════════════
   CAMPANHAS — Lógica principal
   Depende de: db.js (dbInit, DB_USER, DB_IS_GM, dbLogin, dbSignup, dbLogout)
═══════════════════════════════════════════════════════════════ */

// ─── Estado ───────────────────────────────────────────────────

let _campanhasMinhas = [];
let _campanhasParticipo = [];
let _campanhasBuscadas = [];

// ─── Inicialização ────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  mostrarAuthOverlay(true);

  const user = await dbInit();

  if (user) {
    onLogin(user);
  } else {
    mostrarAuthOverlay(false);
  }

  // Tab switching
  document.querySelectorAll('.camp-tab').forEach(btn => {
    btn.addEventListener('click', () => trocarTab(btn.dataset.tab));
  });

  // Modal nova campanha
  document.getElementById('btn-nova-camp').addEventListener('click', abrirModalNova);
  document.getElementById('btn-nova-camp-2')?.addEventListener('click', abrirModalNova);
  document.getElementById('btn-cancel-camp').addEventListener('click', fecharModalNova);
  document.getElementById('btn-buscar-camp').addEventListener('click', buscarCampanha);
  document.getElementById('btn-criar-camp').addEventListener('click', criarCampanha);
  document.getElementById('modal-nova-camp').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharModalNova();
  });

  document.getElementById('inp-camp-nome').addEventListener('keydown', e => {
    if (e.key === 'Enter') criarCampanha();
  });
});

// ─── Auth helpers (espelham o padrão de ficha/index.html) ─────

function mostrarAuthOverlay(loading) {
  const overlay = document.getElementById('auth-overlay');
  overlay.style.display = 'flex';
  document.getElementById('auth-loading-init').style.display = loading ? 'block' : 'none';
  document.getElementById('auth-forms').style.display = loading ? 'none' : 'block';
}

async function onLogin(user) {
  document.getElementById('auth-overlay').style.display = 'none';

  // dbRegisterUser() não é aguardado em dbInit — aguardá-lo aqui garante que o
  // SDK Firestore estabeleça conexão com o servidor antes da leitura source:server em dbGetUser.
  await dbRegisterUser().catch(() => { });
  const perfil = await dbGetUser(user.uid).catch(() => null);
  _atualizarTopbar(perfil, user);

  _carregarPaineis();
}

function _atualizarTopbar(perfil, user) {
  const displayName = perfil?.username || user.email;

  document.getElementById('user-bar').style.display = 'flex';
  document.getElementById('user-email-display').textContent = displayName;
  document.getElementById('gm-badge').style.display = DB_IS_GM ? 'inline' : 'none';

  const btnPerfil = document.getElementById('btn-perfil');
  if (btnPerfil) btnPerfil.style.display = 'inline-flex';

  const avatarEl = document.getElementById('user-avatar-mini');
  if (avatarEl) {
    if (perfil?.avatarUrl) {
      avatarEl.innerHTML = '<img src="' + perfil.avatarUrl + '" alt="">';
    } else {
      avatarEl.textContent = displayName[0].toUpperCase();
    }
  }
}

async function authLogin() {
  const email = document.getElementById('auth-email').value.trim();
  const senha = document.getElementById('auth-password').value;
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  const btn = document.getElementById('auth-login-btn');
  btn.disabled = true;
  try {
    const user = await dbLogin(email, senha);
    onLogin(user);
  } catch (e) {
    errEl.textContent = _mensagemErro(e);
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}

async function authSignup() {
  const email = document.getElementById('auth-signup-email').value.trim();
  const senha = document.getElementById('auth-signup-password').value;
  const errEl = document.getElementById('auth-error');
  errEl.style.display = 'none';
  const btn = document.getElementById('auth-signup-btn');
  btn.disabled = true;
  try {
    const user = await dbSignup(email, senha);
    onLogin(user);
  } catch (e) {
    errEl.textContent = _mensagemErro(e);
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
  }
}

async function authLogout() {
  await dbLogout();
  location.reload();
}

function authSwitchTab(tab) {
  document.getElementById('auth-form-login').style.display = tab === 'login' ? 'block' : 'none';
  document.getElementById('auth-form-signup').style.display = tab === 'signup' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.getElementById('auth-error').style.display = 'none';
}

function toggleSenha(id, btn) {
  const inp = document.getElementById(id);
  const revelado = inp.type === 'text';
  inp.type = revelado ? 'password' : 'text';
  btn.classList.toggle('revelado', !revelado);
}

function _mensagemErro(e) {
  const map = {
    'auth/user-not-found': 'E-mail não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-email': 'E-mail inválido.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado.',
    'auth/weak-password': 'Senha muito fraca (mínimo 6 caracteres).',
    'auth/too-many-requests': 'Muitas tentativas. Tente mais tarde.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
  };
  return map[e.code] || e.message || 'Erro desconhecido.';
}

// ─── Tabs ─────────────────────────────────────────────────────

function trocarTab(tab) {
  document.querySelectorAll('.camp-tab').forEach(b => {
    const ativo = b.dataset.tab === tab;
    b.classList.toggle('active', ativo);
    b.setAttribute('aria-selected', ativo ? 'true' : 'false');
  });

  const paineis = { minhas: 'panel-minhas', participo: 'panel-participo' };
  Object.entries(paineis).forEach(([key, id]) => {
    document.getElementById(id).style.display = key === tab ? 'block' : 'none';
  });

  // Botão "Nova Campanha" só faz sentido na aba do GM
  document.getElementById('btn-nova-camp').style.display = tab === 'minhas' ? 'inline-block' : 'none';
}

// ─── Carregar dados ───────────────────────────────────────────

async function _carregarPaineis() {
  await Promise.all([
    _carregarMinhas(),
    _carregarParticipo(),
  ]);
}

async function _carregarMinhas() {
  setLoading('minhas', true);
  try {
    const snap = await _db.collection('campanhas')
      .where('gmId', '==', DB_USER.uid)
      .orderBy('createdAt', 'desc')
      .get();
    _campanhasMinhas = snap.docs.map(_docToCampanha);
    _renderizarGrid('grid-minhas', 'empty-minhas', _campanhasMinhas, true);
  } catch (e) {
    console.warn('[campanhas] Erro ao carregar minhas campanhas:', e);
    _renderizarGrid('grid-minhas', 'empty-minhas', [], true);
  } finally {
    setLoading('minhas', false);
  }
}

async function _carregarParticipo() {
  setLoading('participo', true);
  try {
    const snap = await _db.collection('campanhas')
      .where('jogadoresIds', 'array-contains', DB_USER.uid)
      .orderBy('createdAt', 'desc')
      .get();
    _campanhasParticipo = snap.docs.map(_docToCampanha);
    _renderizarGrid('grid-participo', 'empty-participo', _campanhasParticipo, false);
  } catch (e) {
    console.warn('[campanhas] Erro ao carregar campanhas que participo:', e);
    _renderizarGrid('grid-participo', 'empty-participo', [], false);
  } finally {
    setLoading('participo', false);
  }
}

function setLoading(tab, show) {
  document.getElementById('loading-' + tab).style.display = show ? 'block' : 'none';
}

// ─── Renderização ─────────────────────────────────────────────

function _renderizarGrid(gridId, emptyId, campanhas, isGM) {
  const grid = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);

  if (!campanhas.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = campanhas.map(c => _campCard(c, isGM)).join('');
}

function _campCard(c, isGM) {
  const statusLabel = { ativa: 'Ativa', pausada: 'Pausada', encerrada: 'Encerrada' }[c.status] || c.status;
  const meta = isGM
    ? `<span class="camp-meta-item"><span class="camp-meta-icon">👥</span>${c.jogadoresIds.length} jogador${c.jogadoresIds.length !== 1 ? 'es' : ''}</span>`
    : `<span class="camp-meta-item"><span class="camp-meta-icon">🧙</span>${c.gmEmail || 'Mestre'}</span>`;

  return `
    <div class="camp-card">
      <div class="camp-card-top">
        <h3 class="camp-name">${_esc(c.nome)}</h3>
        <span class="camp-status camp-status--${c.status}">${statusLabel}</span>
      </div>
      <p class="camp-desc">${_esc(c.descricao || 'Sem descrição.')}</p>
      <div class="camp-meta">${meta}</div>
      <div class="camp-card-footer">
        <span class="camp-system-tag">d100</span>
        <a href="detalhes/?id=${c.id}" class="btn-entrar">Entrar →</a>
      </div>
    </div>`;
}

// ─── Modal nova campanha ──────────────────────────────────────

function abrirModalNova() {
  document.getElementById('inp-camp-nome').value = '';
  document.getElementById('inp-camp-desc').value = '';
  document.getElementById('camp-modal-error').style.display = 'none';
  document.getElementById('modal-nova-camp').classList.add('open');
  setTimeout(() => document.getElementById('inp-camp-nome').focus(), 50);
}

function fecharModalNova() {
  document.getElementById('modal-nova-camp').classList.remove('open');
}

async function buscarCampanha() {
  const nomeDaCampanha = document.getElementById('inp-busca-camp').value.trim();

  const resultados = document.getElementById('search-results');
  const barraDeCarregamento = document.getElementById('search-loading');
  const resultadoVazio = document.getElementById('search-empty');
  const buscaVazia = document.getElementById('value-empty');

  resultados.style.display = 'inline';
  barraDeCarregamento.style.display = 'none';
  resultadoVazio.style.display = 'none';
  buscaVazia.style.display = 'none';

  if (nomeDaCampanha.length === 0) {
    buscaVazia.style.display = 'inline';
    return;
  }

  let snap;

  try {
    barraDeCarregamento.style.display = 'inline';

    snap = await _db.collection('campanhas')
      .where('nome', '==', nomeDaCampanha)
      .orderBy('createdAt', 'desc')
      .get();

      _campanhasBuscadas = snap.docs.map(_docToCampanha);

      console.log(_campanhasBuscadas);
  }
  catch (e) {
    console.log(e);
  }
  finally {
    barraDeCarregamento.style.display = 'none';

    _renderizarGrid('grid-busca', 'search-empty', _campanhasBuscadas, false);
  }
}

async function criarCampanha() {
  const nome = document.getElementById('inp-camp-nome').value.trim();
  const desc = document.getElementById('inp-camp-desc').value.trim();
  const errEl = document.getElementById('camp-modal-error');
  const btn = document.getElementById('btn-criar-camp');

  if (!nome) {
    errEl.textContent = 'Informe um nome para a campanha.';
    errEl.style.display = 'block';
    document.getElementById('inp-camp-nome').focus();
    return;
  }

  errEl.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Criando…';

  try {
    const ref = await _db.collection('campanhas').add({
      nome,
      descricao: desc,
      sistema: 'd100',
      status: 'ativa',
      gmId: DB_USER.uid,
      gmEmail: DB_USER.email,
      jogadoresIds: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    fecharModalNova();
    mostrarToast('✓ Campanha criada!');
    await _carregarMinhas();
  } catch (e) {
    errEl.textContent = 'Erro ao criar campanha: ' + (e.message || 'tente novamente.');
    errEl.style.display = 'block';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Criar Campanha';
  }
}

// ─── Toast ────────────────────────────────────────────────────

function mostrarToast(msg) {
  const t = document.getElementById('save-toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ─── Helpers ─────────────────────────────────────────────────

function _docToCampanha(doc) {
  const d = doc.data();
  return {
    id: doc.id,
    nome: d.nome || 'Sem nome',
    descricao: d.descricao || '',
    sistema: d.sistema || 'd100',
    status: d.status || 'ativa',
    gmId: d.gmId || '',
    gmEmail: d.gmEmail || '',
    jogadoresIds: d.jogadoresIds || [],
  };
}

function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
