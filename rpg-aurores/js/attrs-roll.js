/* ═══════════════════════════════════════════════════════════════
   ROLAGEM E DISTRIBUIÇÃO DE ATRIBUTOS BASE (3d6 × 5)
═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const ATTRS = [
    { key: 'for',      name: 'FOR — Força' },
    { key: 'des',      name: 'DES — Destreza' },
    { key: 'int_attr', name: 'INT — Inteligência' },
    { key: 'con',      name: 'CON — Constituição' },
    { key: 'apa',      name: 'APA — Aparência' },
    { key: 'pod',      name: 'POD — Poder' },
    { key: 'tam',      name: 'TAM — Tamanho' },
    { key: 'edu',      name: 'EDU — Educação' },
  ];

  function roll3d6x5() {
    let sum = 0;
    for (let i = 0; i < 3; i++) sum += Math.floor(Math.random() * 6) + 1;
    return sum * 5;
  }

  let currentCharId = null;
  let currentValues = [];
  let assignments = {}; // { valueIndex: attrKey }

  function getOverlay() {
    return document.getElementById('attrs-roll-overlay');
  }

  function closeModal() {
    const overlay = getOverlay();
    if (overlay) overlay.style.display = 'none';
  }

  function updateConfirmBtn() {
    const btn = document.getElementById('attrs-roll-confirm');
    if (!btn) return;
    const count = Object.keys(assignments).length;
    const allDone = count >= 8;
    btn.disabled = !allDone;
    btn.style.opacity = allDone ? '1' : '0.45';
  }

  function renderRows() {
    const list = document.getElementById('attrs-roll-list');
    if (!list) return;

    const usedAttrs = new Set(Object.values(assignments));

    list.innerHTML = '';
    currentValues.forEach((val, i) => {
      const selectedKey = assignments[i] || '';

      const opts = ATTRS.map(a => {
        const isUsedElsewhere = usedAttrs.has(a.key) && a.key !== selectedKey;
        const disabled = isUsedElsewhere ? 'disabled' : '';
        const sel = a.key === selectedKey ? 'selected' : '';
        return `<option value="${a.key}" ${disabled} ${sel}>${a.name}</option>`;
      }).join('');

      const row = document.createElement('div');
      row.className = 'attrs-roll-row';
      row.innerHTML = `
        <span class="attrs-roll-value">${val}</span>
        <span class="attrs-roll-arrow">→</span>
        <select class="attrs-roll-select" data-idx="${i}">
          <option value="">— Escolha o Atributo —</option>
          ${opts}
        </select>
      `;

      row.querySelector('select').addEventListener('change', e => {
        const idx = parseInt(e.target.dataset.idx);
        const newKey = e.target.value;

        if (newKey) {
          // Clear any other index that already had this attr assigned
          Object.keys(assignments).forEach(k => {
            if (assignments[k] === newKey && parseInt(k) !== idx) {
              delete assignments[k];
            }
          });
          assignments[idx] = newKey;
        } else {
          delete assignments[idx];
        }

        renderRows();
        updateConfirmBtn();
      });

      list.appendChild(row);
    });

    updateConfirmBtn();
  }

  function performRoll() {
    currentValues = Array.from({ length: 8 }, roll3d6x5);
    assignments = {};
    renderRows();
  }

  function confirmAssignment() {
    if (!currentCharId) return;
    const c = document.getElementById('content-' + currentCharId);
    if (!c) return;

    Object.entries(assignments).forEach(([idxStr, attrKey]) => {
      const val = currentValues[parseInt(idxStr)];
      const input = c.querySelector(`[data-field="${attrKey}"]`);
      if (input) {
        input.value = val;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    closeModal();
  }

  window.abrirRolarAtributos = function (id) {
    currentCharId = id;
    const overlay = getOverlay();
    if (!overlay) return;
    performRoll();
    overlay.style.display = 'flex';
  };

  document.addEventListener('DOMContentLoaded', () => {
    const overlay = getOverlay();
    if (!overlay) return;

    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeModal();
    });

    document.getElementById('attrs-roll-close')?.addEventListener('click', closeModal);
    document.getElementById('attrs-roll-reroll')?.addEventListener('click', performRoll);
    document.getElementById('attrs-roll-confirm')?.addEventListener('click', confirmAssignment);
  });

})();
