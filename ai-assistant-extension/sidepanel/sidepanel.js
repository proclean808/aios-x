// SideGemGPT Enhanced v2.1.0 — Side Panel
// Adds VoiceAgentLayer: ElevenLabs + Smallest.ai fast-conversation engine
// with full STT → LLM → TTS loop and browser fallback.

// ============================================================================
// VoiceAgentLayer — premium TTS with streaming audio playback
// ============================================================================

class VoiceAgentLayer {
  constructor() {
    this.audioCtx = null;
    this.currentSource = null;
  }

  // Speak text via the configured provider, with lifecycle callbacks.
  async speak(text, settings, { onStart, onEnd, onError } = {}) {
    if (!text?.trim()) { onEnd?.(); return; }

    const { ttsProvider, elevenLabsApiKey, elevenLabsVoiceId, smallestApiKey, smallestVoiceId } = settings;

    try {
      if (ttsProvider === 'elevenlabs' && elevenLabsApiKey) {
        await this._elevenLabs(text, elevenLabsApiKey, elevenLabsVoiceId || 'cgSgspJ2msm6clMCkdW9', onStart, onEnd);
        return;
      }
      if (ttsProvider === 'smallest' && smallestApiKey) {
        await this._smallest(text, smallestApiKey, smallestVoiceId || 'emily', onStart, onEnd);
        return;
      }
    } catch (err) {
      console.warn(`[VoiceAgentLayer] ${ttsProvider} failed, falling back to browser:`, err.message);
      onError?.(err);
    }

    // Browser SpeechSynthesis fallback
    await this._browser(text, onStart, onEnd);
  }

  // Stop any currently playing audio immediately.
  stop() {
    try { this.currentSource?.stop(); } catch {}
    window.speechSynthesis?.cancel();
  }

  // ---------------------------------------------------------------------------
  // ElevenLabs — eleven_turbo_v2_5 (lowest latency flash model)
  // ---------------------------------------------------------------------------

  async _elevenLabs(text, apiKey, voiceId, onStart, onEnd) {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.75, use_speaker_boost: true },
        output_format: 'mp3_44100_128'
      })
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`ElevenLabs ${res.status}: ${msg}`);
    }

    onStart?.();
    await this._playResponse(res);
    onEnd?.();
  }

  // ---------------------------------------------------------------------------
  // Smallest.ai — Lightning model (ultra-low latency)
  // ---------------------------------------------------------------------------

  async _smallest(text, apiKey, voiceId, onStart, onEnd) {
    const res = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId,
        speed: 1.0,
        sample_rate: 24000,
        add_wav_header: true
      })
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      throw new Error(`Smallest.ai ${res.status}: ${msg}`);
    }

    onStart?.();
    await this._playResponse(res);
    onEnd?.();
  }

  // ---------------------------------------------------------------------------
  // Browser SpeechSynthesis fallback
  // ---------------------------------------------------------------------------

  _browser(text, onStart, onEnd) {
    return new Promise(resolve => {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
      utterance.onstart = onStart;
      utterance.onend  = () => { onEnd?.(); resolve(); };
      utterance.onerror = () => { onEnd?.(); resolve(); };
      synth.speak(utterance);
    });
  }

  // ---------------------------------------------------------------------------
  // Shared audio playback via Web Audio API
  // ---------------------------------------------------------------------------

  async _playResponse(response) {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') await this.audioCtx.resume();

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer  = await this.audioCtx.decodeAudioData(arrayBuffer);

    try { this.currentSource?.stop(); } catch {}

    const source = this.audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.audioCtx.destination);
    this.currentSource = source;

    return new Promise(resolve => {
      source.onended = resolve;
      source.start(0);
    });
  }
}

// ============================================================================
// SidePanelApp — main application
// ============================================================================

class SidePanelApp {
  constructor() {
    this.settings         = {};
    this.chatHistory      = [];
    this.conversationHistory = [];
    this.isRecording      = false;
    this.recognition      = null;
    this.ttsEnabled       = true;
    this.autoSubmitVoice  = false;
    this.agentActive      = false;

    this.voiceAgent = new VoiceAgentLayer();
    this.init();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async init() {
    await this.loadSettings();
    await this.loadChatHistory();
    this.applyTheme();
    this.setupEventListeners();
    this.initVoiceRecognition();
    this.renderChatHistory();
    this.updateModelSelector();
    this.updateSettingsModal();
    this.updateActionButtons();
    this._syncAgentProviderUI();
  }

  // ---------------------------------------------------------------------------
  // Settings & Storage
  // ---------------------------------------------------------------------------

  async loadSettings() {
    const res = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (res?.success) this.settings = res.data;
  }

  async saveSettings() {
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', data: this.settings });
  }

  async loadChatHistory() {
    const res = await chrome.runtime.sendMessage({ type: 'GET_CHAT_HISTORY' });
    if (res?.success) this.chatHistory = res.data;
  }

  async saveChatEntry(entry) {
    await chrome.runtime.sendMessage({ type: 'SAVE_CHAT_HISTORY', data: entry });
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode', 'auto-theme');
    const t = this.settings.theme;
    if (t === 'dark') document.body.classList.add('dark-mode');
    else if (t === 'light') document.body.classList.add('light-mode');
    else document.body.classList.add('auto-theme');
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------

  setupEventListeners() {
    // Tabs
    document.querySelectorAll('.nav-tab').forEach(t =>
      t.addEventListener('click', e => this.handleTabClick(e))
    );

    // Background messages
    chrome.runtime.onMessage.addListener(msg => {
      if (msg.type === 'CONTEXT_TRANSLATE' && msg.data?.text) this.activateTranslateTab(msg.data.text);
      if (msg.type === 'ACTIVATE_TAB') {
        document.querySelectorAll('.nav-tab').forEach(t => {
          if (t.dataset.tab === msg.data.tab) t.click();
        });
      }
    });

    // Chat
    const chatInput = document.getElementById('chat-input');
    const sendBtn   = document.getElementById('send-btn');
    chatInput.addEventListener('input', () => this.toggleSendButton(chatInput, sendBtn));
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });
    sendBtn.addEventListener('click', () => this.sendChatMessage());
    document.getElementById('model-select').addEventListener('change', e => this.handleModelChange(e));

    // Voice STT controls
    document.getElementById('voice-btn').addEventListener('click', () => {
      this.isRecording ? this.stopVoiceRecognition() : this.startVoiceRecognition();
    });
    document.getElementById('tts-btn')?.addEventListener('click', () => this.toggleTTS());
    document.getElementById('auto-submit-toggle')?.addEventListener('click', () => this.toggleAutoSubmit());

    // Voice Agent
    document.getElementById('voice-agent-btn')?.addEventListener('click', () => {
      this.agentActive ? this.deactivateAgent() : this.activateAgent();
    });
    document.getElementById('stop-agent-btn')?.addEventListener('click', () => this.deactivateAgent());
    document.getElementById('tts-provider-select')?.addEventListener('change', e => {
      this.settings.ttsProvider = e.target.value;
      this._syncAgentProviderUI();
    });

    // Translate
    document.getElementById('swap-languages').addEventListener('click', () => this.swapLanguages());
    document.getElementById('translate-btn').addEventListener('click', () => this.translateText());
    document.getElementById('copy-translation').addEventListener('click', () => this.copyTranslation());
    document.getElementById('translate-input').addEventListener('input', () => this.toggleTranslateButton());

    // History
    document.getElementById('clear-history').addEventListener('click', () => this.clearChatHistory());

    // Image generation
    document.getElementById('generate-image-btn').addEventListener('click', () => this.generateImage());
    document.querySelectorAll('.style-btn').forEach(b =>
      b.addEventListener('click', e => this.handleStylePresetClick(e))
    );

    // Integrations
    ['sheets', 'notion', 'trello'].forEach(s => {
      document.getElementById(`connect-${s}`)?.addEventListener('click', () => this.connectService(s));
    });
    document.getElementById('export-to-sheets')?.addEventListener('click', () => this.exportToSheets());
    document.getElementById('save-to-notion')?.addEventListener('click', () => this.saveToNotion());
    document.getElementById('create-trello-card')?.addEventListener('click', () => this.createTrelloCard());

    // Settings
    document.getElementById('settings-btn').addEventListener('click', () => this.openSettingsModal());
    document.getElementById('close-settings').addEventListener('click', () => this.closeSettingsModal());
    document.getElementById('save-settings').addEventListener('click', () => this.saveSettingsAndCloseModal());
  }

  handleTabClick(event) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    event.currentTarget.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(event.currentTarget.dataset.tab + '-tab').classList.add('active');
    if (event.currentTarget.dataset.tab === 'history') this.renderChatHistory();
  }

  // ---------------------------------------------------------------------------
  // Chat
  // ---------------------------------------------------------------------------

  toggleSendButton(chatInput, sendBtn) {
    sendBtn.disabled = !chatInput.value.trim();
  }

  toggleTranslateButton() {
    const btn = document.getElementById('translate-btn');
    if (btn) btn.disabled = !document.getElementById('translate-input').value.trim();
  }

  async sendChatMessage() {
    const chatInput    = document.getElementById('chat-input');
    const message      = chatInput.value.trim();
    if (!message) return;

    const selectedModel = document.getElementById('model-select').value;
    this.addMessageToChat('user', message);
    this.conversationHistory.push({ role: 'user', content: message });
    chatInput.value = '';
    this.toggleSendButton(chatInput, document.getElementById('send-btn'));

    if (this.agentActive) this.setAgentState('thinking');

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        data: { message, model: selectedModel, conversationHistory: this.conversationHistory }
      });

      if (response?.success) {
        const aiText = typeof response.data === 'string' ? response.data : response.data?.response;
        this.addMessageToChat('ai', aiText, selectedModel);
        this.conversationHistory.push({ role: 'assistant', content: aiText });
        this.saveChatEntry({ type: 'chat', request: message, response: aiText, model: selectedModel });
        await this.speakText(aiText);
      } else {
        this.addMessageToChat('ai', `Error: ${response?.error || 'Unknown error'}`, 'system');
        if (this.agentActive) this.setAgentState('listening');
      }
    } catch (err) {
      this.addMessageToChat('ai', `Error: ${err.message}`, 'system');
      if (this.agentActive) this.setAgentState('listening');
    }
  }

  addMessageToChat(sender, text, model = '') {
    const container = document.getElementById('chat-messages');
    const bubble    = document.createElement('div');
    bubble.classList.add('message-bubble', sender);
    const content = document.createElement('div');
    content.classList.add('message-content');
    content.textContent = text;
    bubble.appendChild(content);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
  }

  handleModelChange(e) {
    this._setProviderIndicator(e.target.value);
  }

  updateModelSelector() {
    this._setProviderIndicator(document.getElementById('model-select')?.value || '');
  }

  _setProviderIndicator(model) {
    const el = document.getElementById('provider-indicator');
    if (!el) return;
    if (model.includes('claude'))  el.textContent = 'Anthropic';
    else if (model.includes('gemini')) el.textContent = 'Google';
    else if (model.includes('llama'))  el.textContent = 'Ollama';
    else el.textContent = 'OpenAI';
  }

  // ---------------------------------------------------------------------------
  // Voice Agent Layer — STT → LLM → TTS fast-conversation loop
  // ---------------------------------------------------------------------------

  activateAgent() {
    this.agentActive = true;
    document.getElementById('voice-agent-panel')?.classList.remove('hidden');
    document.getElementById('voice-agent-btn')?.classList.add('active');
    document.getElementById('voice-agent-btn').textContent = '⏹ Stop Agent';
    this.setAgentState('listening');
    this.startVoiceRecognition();
  }

  deactivateAgent() {
    this.agentActive = false;
    this.stopVoiceRecognition();
    this.voiceAgent.stop();
    document.getElementById('voice-agent-panel')?.classList.add('hidden');
    const btn = document.getElementById('voice-agent-btn');
    if (btn) btn.textContent = '🎙 Start Agent';
    btn?.classList.remove('active');
    this.setAgentState('ready');
  }

  setAgentState(state) {
    const el = document.getElementById('agent-state-text');
    const panel = document.getElementById('voice-agent-panel');
    if (el) {
      const labels = { listening: '🎙 Listening...', speaking: '🔊 Speaking...', thinking: '💭 Thinking...', ready: '● Ready' };
      el.textContent = labels[state] || state;
    }
    panel?.setAttribute('data-state', state);
  }

  _syncAgentProviderUI() {
    const sel = document.getElementById('tts-provider-select');
    if (sel) sel.value = this.settings.ttsProvider || 'browser';

    const badge = document.getElementById('agent-provider-badge');
    if (badge) {
      const labels = { elevenlabs: 'ElevenLabs', smallest: 'Smallest.ai', browser: 'Browser' };
      badge.textContent = labels[this.settings.ttsProvider] || 'Browser';
    }
  }

  // ---------------------------------------------------------------------------
  // Voice — Speech-to-Text (Web Speech API)
  // ---------------------------------------------------------------------------

  initVoiceRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceBtn = document.getElementById('voice-btn');

    if (!SR) {
      if (voiceBtn) { voiceBtn.disabled = true; voiceBtn.classList.add('unsupported'); voiceBtn.title = 'Speech recognition not supported'; }
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous    = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      voiceBtn?.classList.add('recording');
      document.getElementById('chat-input')?.classList.add('listening');
    };

    this.recognition.onresult = event => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      const interimEl = document.getElementById('interim-transcript');
      const chatInput = document.getElementById('chat-input');

      if (final) {
        const text = final.trim();
        chatInput.value = (chatInput.value.trim() ? chatInput.value.trim() + ' ' : '') + text;
        chatInput.dispatchEvent(new Event('input'));
        if (interimEl) interimEl.textContent = '';
      }
      if (interim && interimEl) interimEl.textContent = interim;
    };

    this.recognition.onerror = event => {
      const msgs = {
        'not-allowed': 'Microphone access denied.',
        'no-speech':   'No speech detected.',
        'network':     'Network error during recognition.',
        'audio-capture': 'No microphone found.',
      };
      console.warn('[STT]', msgs[event.error] || event.error);
      this.stopVoiceRecognition();
      // In agent mode, retry listening after a brief pause
      if (this.agentActive && event.error === 'no-speech') {
        setTimeout(() => { if (this.agentActive) this.startVoiceRecognition(); }, 800);
      }
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      voiceBtn?.classList.remove('recording');
      document.getElementById('chat-input')?.classList.remove('listening');
      const interimEl = document.getElementById('interim-transcript');
      if (interimEl) interimEl.textContent = '';

      const chatInput = document.getElementById('chat-input');
      const hasContent = chatInput?.value.trim();

      if (this.agentActive && hasContent) {
        // Agent loop: auto-send, then TTS will restart listening on completion
        document.getElementById('send-btn')?.click();
      } else if (!this.agentActive && this.autoSubmitVoice && hasContent) {
        document.getElementById('send-btn')?.click();
      }
    };
  }

  startVoiceRecognition() {
    if (this.recognition && !this.isRecording) {
      try { this.isRecording = true; this.recognition.start(); }
      catch (e) { console.error('STT start error:', e); this.isRecording = false; }
    }
  }

  stopVoiceRecognition() {
    if (this.recognition && this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
    }
    document.getElementById('voice-btn')?.classList.remove('recording');
    document.getElementById('chat-input')?.classList.remove('listening');
    const el = document.getElementById('interim-transcript');
    if (el) el.textContent = '';
  }

  // ---------------------------------------------------------------------------
  // Voice — TTS (routes through VoiceAgentLayer)
  // ---------------------------------------------------------------------------

  async speakText(text) {
    if (!this.ttsEnabled || !text) {
      if (this.agentActive) { this.setAgentState('listening'); this.startVoiceRecognition(); }
      return;
    }

    await this.voiceAgent.speak(text, this.settings, {
      onStart: () => { if (this.agentActive) this.setAgentState('speaking'); },
      onEnd:   () => {
        if (this.agentActive) {
          // TTS done → restart listening for next user turn
          this.setAgentState('listening');
          this.startVoiceRecognition();
        }
      },
      onError: () => {
        if (this.agentActive) { this.setAgentState('listening'); this.startVoiceRecognition(); }
      }
    });
  }

  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    if (!this.ttsEnabled) this.voiceAgent.stop();
    const btn = document.getElementById('tts-btn');
    btn?.classList.toggle('muted', !this.ttsEnabled);
    btn?.setAttribute('title', this.ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice');
  }

  toggleAutoSubmit() {
    this.autoSubmitVoice = !this.autoSubmitVoice;
    document.getElementById('auto-submit-toggle')?.classList.toggle('active', this.autoSubmitVoice);
  }

  // ---------------------------------------------------------------------------
  // Translate
  // ---------------------------------------------------------------------------

  swapLanguages() {
    const s = document.getElementById('source-lang');
    const t = document.getElementById('target-lang');
    [s.value, t.value] = [t.value, s.value];
  }

  async translateText() {
    const text = document.getElementById('translate-input').value.trim();
    if (!text) return;
    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    const btn  = document.getElementById('translate-btn');
    const out  = document.getElementById('translate-output');
    const copy = document.getElementById('copy-translation');
    btn.disabled = true;
    out.innerHTML = '<div class="placeholder">Translating...</div>';
    copy.style.display = 'none';
    try {
      const res = await chrome.runtime.sendMessage({ type: 'TRANSLATE_REQUEST', data: { text, sourceLanguage: sourceLang, targetLanguage: targetLang } });
      if (res?.success) {
        out.textContent = res.data.translatedText;
        copy.style.display = 'inline-flex';
        this.saveChatEntry({ type: 'translate', request: text, response: res.data.translatedText, source: sourceLang, target: targetLang });
      } else {
        out.textContent = `Error: ${res?.error || 'Unknown'}`;
      }
    } catch (e) { out.textContent = `Error: ${e.message}`; }
    finally { btn.disabled = false; }
  }

  copyTranslation() {
    navigator.clipboard.writeText(document.getElementById('translate-output').textContent);
  }

  activateTranslateTab(text) {
    document.querySelector('.nav-tab[data-tab="translate"]').click();
    document.getElementById('translate-input').value = text;
    this.translateText();
  }

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  renderChatHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '';
    if (!this.chatHistory.length) {
      list.innerHTML = `<div class="empty-history"><div class="empty-icon">📝</div><p>No chat history yet</p><small>Your conversations will appear here</small></div>`;
      return;
    }
    this.chatHistory.forEach(entry => {
      const item = document.createElement('div');
      item.classList.add('history-item');
      let type = '', content = '';
      if (entry.type === 'chat')      { type = `Chat (${entry.model})`; content = `**You:** ${entry.request}\n**AI:** ${entry.response}`; }
      else if (entry.type === 'translate') { type = `Translate (${entry.source} → ${entry.target})`; content = `**Original:** ${entry.request}\n**Translated:** ${entry.response}`; }
      else if (entry.type === 'image_generation') { type = `Image (${entry.model})`; content = `**Prompt:** ${entry.request}`; }
      item.innerHTML = `<div class="history-item-header"><span class="type">${type}</span><span class="date">${new Date(entry.timestamp).toLocaleString()}</span></div><div class="history-item-content">${content}</div>`;
      list.appendChild(item);
    });
  }

  async clearChatHistory() {
    if (!confirm('Clear all chat history?')) return;
    await chrome.storage.local.clear();
    this.chatHistory = [];
    this.conversationHistory = [];
    this.renderChatHistory();
  }

  // ---------------------------------------------------------------------------
  // Settings Modal
  // ---------------------------------------------------------------------------

  openSettingsModal() {
    document.getElementById('settings-modal').classList.add('active');
    this.updateSettingsModal();
  }

  closeSettingsModal() {
    document.getElementById('settings-modal').classList.remove('active');
  }

  updateSettingsModal() {
    const set   = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };
    const check = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };
    const s = this.settings;
    set('openai-key', s.openaiApiKey);
    set('anthropic-key', s.anthropicApiKey);
    set('google-key', s.googleApiKey);
    set('ollama-url', s.ollamaUrl || 'http://localhost:11434');
    set('theme-select', s.theme || 'auto');
    check('auto-translate', s.autoTranslate);
    set('slack-webhook-url', s.slackWebhookUrl);
    set('slack-chart-url', s.slackChartUrl);
    set('sheets-key', s.sheetsApiKey);
    set('notion-token', s.notionToken);
    set('trello-key', s.trelloApiKey);
    set('trello-token', s.trelloToken);
    // Voice engine
    set('elevenlabs-key', s.elevenLabsApiKey);
    set('elevenlabs-voice', s.elevenLabsVoiceId);
    set('smallest-key', s.smallestApiKey);
    set('smallest-voice', s.smallestVoiceId);
    set('tts-provider-settings', s.ttsProvider || 'browser');
  }

  async saveSettingsAndCloseModal() {
    const get   = id => document.getElementById(id)?.value || '';
    const chk   = id => document.getElementById(id)?.checked || false;
    this.settings = {
      ...this.settings,
      openaiApiKey:      get('openai-key'),
      anthropicApiKey:   get('anthropic-key'),
      googleApiKey:      get('google-key'),
      ollamaUrl:         get('ollama-url'),
      theme:             get('theme-select'),
      autoTranslate:     chk('auto-translate'),
      slackWebhookUrl:   get('slack-webhook-url'),
      slackChartUrl:     get('slack-chart-url'),
      sheetsApiKey:      get('sheets-key'),
      notionToken:       get('notion-token'),
      trelloApiKey:      get('trello-key'),
      trelloToken:       get('trello-token'),
      // Voice engine
      elevenLabsApiKey:  get('elevenlabs-key'),
      elevenLabsVoiceId: get('elevenlabs-voice'),
      smallestApiKey:    get('smallest-key'),
      smallestVoiceId:   get('smallest-voice'),
      ttsProvider:       get('tts-provider-settings'),
    };
    await this.saveSettings();
    this.applyTheme();
    this._syncAgentProviderUI();
    this.closeSettingsModal();
  }

  // ---------------------------------------------------------------------------
  // Image Generation
  // ---------------------------------------------------------------------------

  async generateImage() {
    const prompt = document.getElementById('image-prompt-input').value.trim();
    if (!prompt) return;
    const model = document.getElementById('image-model-select').value;
    const btn   = document.getElementById('generate-image-btn');
    const prev  = document.getElementById('generated-image-preview');
    const dl    = document.getElementById('download-image-btn');
    btn.disabled = true;
    prev.innerHTML = '<div class="placeholder">Generating image...</div>';
    dl.style.display = 'none';
    try {
      const res = await chrome.runtime.sendMessage({ type: 'GENERATE_IMAGE_REQUEST', data: { prompt, model } });
      if (res?.success) {
        const url = res.data.imageUrl;
        prev.innerHTML = `<img src="${url}" alt="Generated Image">`;
        dl.href = url; dl.download = 'generated-image.png'; dl.style.display = 'inline-flex';
        this.saveChatEntry({ type: 'image_generation', request: prompt, response: url, model });
      } else {
        prev.innerHTML = `<div class="placeholder">Error: ${res?.error || 'Unknown error'}</div>`;
      }
    } catch (e) { prev.innerHTML = `<div class="placeholder">Error: ${e.message}</div>`; }
    finally { btn.disabled = false; }
  }

  handleStylePresetClick(event) {
    document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
    event.currentTarget.classList.add('active');
    const style = event.currentTarget.dataset.style;
    const input = document.getElementById('image-prompt-input');
    if (!input.value.includes(style)) input.value += `, ${style} style`;
  }

  // ---------------------------------------------------------------------------
  // Integrations
  // ---------------------------------------------------------------------------

  async connectService(service) {
    const keyMap = { sheets: 'sheetsApiKey', notion: 'notionToken', trello: 'trelloApiKey' };
    const labels = { sheets: 'Google Sheets API key', notion: 'Notion integration token', trello: 'Trello API key' };
    if (!this.settings[keyMap[service]]) { alert(`Please configure your ${labels[service]} in Settings first.`); return; }
    const card = document.querySelector(`[data-service="${service}"]`);
    const btn  = card?.querySelector('.connect-btn');
    card?.classList.add('connected');
    if (btn) { btn.textContent = 'Connected'; btn.classList.add('connected'); }
    this.updateActionButtons();
  }

  updateActionButtons() {
    const connected = s => document.querySelector(`[data-service="${s}"]`)?.classList.contains('connected');
    ['export-to-sheets', 'save-to-notion', 'create-trello-card'].forEach((id, i) => {
      const services = ['sheets', 'notion', 'trello'];
      const el = document.getElementById(id);
      if (el) el.disabled = !connected(services[i]);
    });
  }

  async exportToSheets() {
    const res = await chrome.runtime.sendMessage({ type: 'GET_CHAT_HISTORY' });
    if (!res?.data?.length) { alert('No chat history to export.'); return; }
    const r = await chrome.runtime.sendMessage({ type: 'EXPORT_TO_SHEETS', data: { history: res.data } });
    alert(r?.success ? 'Exported to Google Sheets!' : `Failed: ${r?.error}`);
  }

  async saveToNotion() {
    const last = this.chatHistory[this.chatHistory.length - 1];
    if (!last) { alert('No recent conversation to save.'); return; }
    const r = await chrome.runtime.sendMessage({ type: 'SAVE_TO_NOTION', data: { chat: last } });
    alert(r?.success ? 'Saved to Notion!' : `Failed: ${r?.error}`);
  }

  async createTrelloCard() {
    const last = this.chatHistory[this.chatHistory.length - 1];
    if (!last) { alert('No recent conversation to create a card from.'); return; }
    const r = await chrome.runtime.sendMessage({ type: 'CREATE_TRELLO_CARD', data: { chat: last } });
    alert(r?.success ? 'Trello card created!' : `Failed: ${r?.error}`);
  }
}

document.addEventListener('DOMContentLoaded', () => new SidePanelApp());
