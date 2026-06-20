async function initPainel() {
  if (typeof dbConfigured === 'undefined' || !dbConfigured()) {
    _showError('Firebase não configurado.');
    return;
  }
  try {
    const user = await dbInit();
    if (!user) { window.location.href = '../ficha/'; return; }
    if (!DB_IS_GM) { window.location.href = '../ficha/'; return; }

    document.getElementById('painel-loading').style.display = 'none';
    document.getElementById('painel-content').style.display = 'block';
    document.getElementById('user-bar').style.display = 'flex';

    // Carrega jogadores e reusa o próprio registro do DM para a topbar
    const users = await _carregarJogadores();
    const myProfile = users ? users.find(u => u.uid === DB_USER.uid) : null;
    const displayName = myProfile?.username || user.email;

    document.getElementById('user-email-display').textContent = displayName;
    const avatarMini = document.getElementById('user-avatar-mini');
    if (avatarMini) {
      if (myProfile?.avatarUrl) {
        avatarMini.innerHTML = '<img src="' + myProfile.avatarUrl + '" alt="">';
      } else {
        avatarMini.textContent = displayName[0].toUpperCase();
      }
    }
  } catch (e) {
    _showError('Erro ao carregar painel: ' + e.message);
  }
}

async function _carregarJogadores() {
  let users;
  try {
    users = await dbListUsers();
  } catch (e) {
    _showError('Erro ao listar jogadores: ' + e.message);
    return null;
  }

  const grid = document.getElementById('players-grid');

  if (!users.length) {
    document.getElementById('empty-msg').style.display = 'block';
    return users;
  }

  users.forEach(u => {
    const isSelf = u.uid === DB_USER.uid;
    const card = document.createElement('div');
    card.className = 'player-card' + (isSelf ? ' is-self' : '');

    const nomeDisplay = u.username || u.email;
    const avatarHtml = u.avatarUrl
      ? '<img src="' + u.avatarUrl + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" alt="">'
      : nomeDisplay[0].toUpperCase();

    card.innerHTML =
      '<div class="player-avatar">' + avatarHtml + '</div>' +
      '<div style="text-align:center;width:100%;">' +
      '<span class="player-name">' + _escapeHtml(nomeDisplay) + '</span>' +
      (isSelf ? '<span class="player-you">suas fichas</span>' : '') +
      '</div>' +
      '<a class="btn-ver-fichas" href="../ficha/?jogador=' + encodeURIComponent(u.uid) + '">Ver fichas →</a>';
    grid.appendChild(card);
  });

  return users;
}

async function painelLogout() {
  await dbLogout();
  window.location.href = '../ficha/';
}

function _showError(msg) {
  document.getElementById('painel-loading').style.display = 'none';
  document.getElementById('painel-content').style.display = 'none';
  const errEl = document.getElementById('painel-error');
  errEl.style.display = 'flex';
  document.getElementById('error-msg').textContent = msg;
}

function _escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

initPainel();
