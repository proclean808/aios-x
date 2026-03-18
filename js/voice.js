/* ═════════════════════════════════════
   AIOS-X · Voice System
   Speech Recognition + TTS Synthesis
   Supports all flagship model voice APIs
═════════════════════════════════════ */
'use strict';

const VoiceSystem = (() => {
  let recognition = null;
  let isListening = false;
  let targetInputId = null;
  let synth = window.speechSynthesis;
  let currentUtterance = null;
  let voiceEnabled = false;

  // ── COMMANDS MAP ──
  const VOICE_COMMANDS = {
    'open orchestrator': () => switchTab('orchestrator'),
    'open models': () => switchTab('models'),
    'open debate': () => switchTab('debate'),
    'show debate': () => switchTab('debate'),
    'open memory': () => switchTab('memory'),
    'open execution': () => switchTab('execution'),
    'open market': () => switchTab('market'),
    'show market': () => switchTab('market'),
    'open security': () => switchTab('security'),
    'start debate': () => { switchTab('debate'); if (typeof startDebate === 'function') setTimeout(startDebate, 300); },
    'launch orchestration': () => { if (typeof launchOrchestration === 'function') launchOrchestration(); },
    'export report': () => openExportPanel(),
    'add key': () => openVault(),
    'add api key': () => openVault(),
    'clear log': () => {
      const active = document.querySelector('.tab-panel.active');
      const logBody = active?.querySelector('.log-body');
      if (logBody) logBody.innerHTML = '';
    },
    'run pipeline': () => { if (typeof runPipeline === 'function') runPipeline(); },
    'simulate attack': () => { if (typeof simulateAttack === 'function') simulateAttack(); },
    'stop listening': () => stopVoice(),
    'close': () => stopVoice(),
  };

  // ── INIT SPEECH RECOGNITION ──
  function initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 3;

    rec.onstart = () => {
      isListening = true;
      const btn = document.getElementById('voiceBtn');
      if (btn) btn.classList.add('active', 'recording');
      updateVoiceStatus('Listening…', '');
    };

    rec.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const text = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += text;
        else interim += text;
      }

      const display = final || interim;
      updateVoiceTranscript(display);

      if (final) {
        handleVoiceResult(final.trim().toLowerCase());
      }
    };

    rec.onerror = (e) => {
      console.warn('Speech recognition error:', e.error);
      updateVoiceStatus('Error: ' + e.error, '');
      if (e.error !== 'no-speech') stopVoice();
    };

    rec.onend = () => {
      isListening = false;
      const btn = document.getElementById('voiceBtn');
      if (btn) btn.classList.remove('recording');
      if (!document.getElementById('voiceOverlay')?.style.display ||
          document.getElementById('voiceOverlay').style.display === 'none') {
        btn?.classList.remove('active');
      }
    };

    return rec;
  }

  function handleVoiceResult(text) {
    // Check for direct commands
    for (const [cmd, fn] of Object.entries(VOICE_COMMANDS)) {
      if (text.includes(cmd)) {
        fn();
        speak(`Executing: ${cmd}`);
        setTimeout(() => stopVoice(), 800);
        return;
      }
    }

    // If targeting an input field, set the value
    if (targetInputId) {
      const inp = document.getElementById(targetInputId);
      if (inp) {
        inp.value = text;
        inp.dispatchEvent(new Event('input'));
        showToast('Voice input applied', 'success');
      }
      setTimeout(() => stopVoice(), 500);
      return;
    }

    // Otherwise show what was heard
    updateVoiceStatus('Heard: ' + text, '');
    setTimeout(() => stopVoice(), 2000);
  }

  function updateVoiceStatus(status, transcript) {
    const statusEl = document.getElementById('voiceStatus');
    const transcriptEl = document.getElementById('voiceTranscript');
    if (statusEl) statusEl.textContent = status;
    if (transcriptEl && transcript !== undefined) transcriptEl.textContent = transcript || 'Say a command…';
  }

  function updateVoiceTranscript(text) {
    const el = document.getElementById('voiceTranscript');
    if (el) el.textContent = text || '…';
  }

  // ── PUBLIC: TOGGLE VOICE ──
  function toggleVoice() {
    if (isListening) {
      stopVoice();
    } else {
      startGlobalVoice();
    }
  }

  function startGlobalVoice() {
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.style.display = 'flex';
    targetInputId = null;
    startRecognition();
  }

  function startVoiceInput(inputId) {
    targetInputId = inputId;
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.style.display = 'flex';
    updateVoiceStatus('Listening for input…', '');
    startRecognition();
  }

  function startRecognition() {
    if (!recognition) recognition = initRecognition();
    if (!recognition) {
      showToast('Speech recognition not supported in this browser', 'warning');
      return;
    }
    try {
      recognition.start();
    } catch (e) {
      // Already started
      recognition.stop();
      setTimeout(() => recognition.start(), 200);
    }
  }

  function stopVoice() {
    if (recognition) { try { recognition.stop(); } catch {} }
    isListening = false;
    targetInputId = null;
    const overlay = document.getElementById('voiceOverlay');
    if (overlay) overlay.style.display = 'none';
    const btn = document.getElementById('voiceBtn');
    if (btn) btn.classList.remove('active', 'recording');
  }

  // ── TEXT-TO-SPEECH ──
  function speak(text, options = {}) {
    if (!synth || !voiceEnabled) return;
    if (currentUtterance) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 0.8;

    // Try to use a good voice
    const voices = synth.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang === 'en-US') ||
                      voices.find(v => v.lang === 'en-US') ||
                      voices[0];
    if (preferred) utterance.voice = preferred;

    currentUtterance = utterance;
    synth.speak(utterance);
  }

  function stopSpeaking() {
    if (synth) synth.cancel();
  }

  function toggleTTS() {
    voiceEnabled = !voiceEnabled;
    showToast(voiceEnabled ? 'Voice output enabled' : 'Voice output disabled', 'info');
    return voiceEnabled;
  }

  // ── LIVE MODEL VOICE (via Web Audio) ──
  // For native voice models (Gemini Live, GPT-4o Realtime, etc.)
  async function startLiveVoiceSession(modelId, provider) {
    showToast(`Live voice session with ${modelId} — BYOK required`, 'info', 3000);
    // Placeholder: Real implementation would open WebSocket to model's realtime API
    // e.g., OpenAI Realtime API, Gemini Live API
    addLog('orchestrationLogBody', `Live voice session requested: ${modelId}`, 'info');
  }

  // ── BROWSER SUPPORT CHECK ──
  function isSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  return {
    toggleVoice, startVoiceInput, stopVoice,
    speak, stopSpeaking, toggleTTS,
    startLiveVoiceSession, isSupported,
    get isListening() { return isListening; },
    get ttsEnabled() { return voiceEnabled; }
  };
})();

// ── EXPOSE GLOBALS ──
function toggleVoice() { VoiceSystem.toggleVoice(); }
function stopVoice() { VoiceSystem.stopVoice(); }
function startVoiceInput(id) { VoiceSystem.startVoiceInput(id); }
function speak(text) { VoiceSystem.speak(text); }

window.VoiceSystem = VoiceSystem;
window.toggleVoice = toggleVoice;
window.stopVoice = stopVoice;
window.startVoiceInput = startVoiceInput;
window.speak = speak;
