import { initBuilder } from './tabs/builder.js';
import { initPitchStudio } from './tabs/pitchstudio.js';
import { initTracking } from './tabs/tracking.js';
import { initCommunity } from './tabs/community.js';
import { initAssistant } from './tabs/assistant.js';
import { initConcept } from './tabs/concept.js';

const TAB_INITS = {
  builder: initBuilder,
  pitchstudio: initPitchStudio,
  tracking: initTracking,
  community: initCommunity,
  assistant: initAssistant,
  concept: initConcept
};

const initialized = new Set();

function activatePanel(panelName) {
  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panelName);
  });
  // Update panels
  document.querySelectorAll('.panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `panel-${panelName}`);
  });
  // Init tab once on first activation
  if (!initialized.has(panelName) && TAB_INITS[panelName]) {
    TAB_INITS[panelName]();
    initialized.add(panelName);
  }
}

function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => activatePanel(btn.dataset.panel));
  });

  // Keyboard shortcuts 1-6
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    const num = parseInt(e.key);
    if (num >= 1 && num <= 6) {
      const panels = ['builder','pitchstudio','tracking','community','assistant','concept'];
      activatePanel(panels[num - 1]);
    }
    if (e.key === 'Escape') {
      document.getElementById('modalOverlay').style.display = 'none';
    }
  });
}

function initTooltips() {
  const box = document.getElementById('tooltipBox');
  document.addEventListener('mouseover', e => {
    const trigger = e.target.closest('.tooltip-trigger');
    if (!trigger) return;
    const tip = trigger.dataset.tip;
    if (!tip) return;
    box.textContent = tip;
    box.style.display = 'block';
  });
  document.addEventListener('mousemove', e => {
    if (box.style.display === 'none') return;
    const x = e.clientX + 12;
    const y = e.clientY + 12;
    box.style.left = Math.min(x, window.innerWidth - 300) + 'px';
    box.style.top = y + 'px';
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest('.tooltip-trigger')) box.style.display = 'none';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initTooltips();
  // Init first tab immediately
  initBuilder();
  initialized.add('builder');
});
