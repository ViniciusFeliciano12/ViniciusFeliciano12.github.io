async function initPainel() {
  if (typeof dbConfigured === 'undefined' || !dbConfigured()) {
    _showError('Firebase não configurado.');
    return;
  }

  try {
    const user = await dbInit();
    if (!user || !DB_IS_GM) {
      window.location.href = '../ficha/';
      return;
    }

    // 1. Busca todos os dados necessários em background (o loading ainda está na tela)
    const users = await dbListUsers();
    const myProfile = await dbGetUser(DB_USER.uid).catch(() => null);

    // 2. Substitui os dados defasados do próprio usuário na array em memória
    if (myProfile) {
      const selfIndex = users.findIndex(u => u.uid === DB_USER.uid);
      if (selfIndex !== -1) {
        users[selfIndex] = { ...users[selfIndex], ...myProfile };
      }
    }

    // 3. Atualiza os dados da barra de usuário no topo
    const displayName = myProfile?.username || user.email;
    document.getElementById('user-email-display').textContent = displayName;

    const avatarMini = document.getElementById('user-avatar-mini');
    if (avatarMini) {
      avatarMini.innerHTML = myProfile?.avatarUrl
        ? `<img src="${myProfile.avatarUrl}" alt="">`
        : displayName[0].toUpperCase();
    }

    // 4. Constrói os cards na tela usando a lista já corrigida
    _renderizarJogadores(users);

    // 5. Por fim, esconde o loading e exibe a tela perfeitamente montada
    document.getElementById('painel-loading').style.display = 'none';
    document.getElementById('painel-content').style.display = 'block';
    document.getElementById('user-bar').style.display = 'flex';

  } catch (e) {
    _showError('Erro ao carregar painel: ' + e.message);
  }
}

// Alterei o nome da função para refletir que ela não busca mais dados, apenas desenha a tela
function _renderizarJogadores(users) {
  const grid = document.getElementById('players-grid');

  if (!users || !users.length) {
    document.getElementById('empty-msg').style.display = 'block';
    return;
  }

  users.forEach(u => {
    const isSelf = u.uid === DB_USER.uid;
    const card = document.createElement('div');
    card.className = 'player-card' + (isSelf ? ' is-self' : '');

    const nomeDisplay = u.username || u.email;
    const avatarHtml = u.avatarUrl
      ? `<img src="${u.avatarUrl}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" alt="">`
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