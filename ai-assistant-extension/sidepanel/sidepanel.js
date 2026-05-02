// SideGemGPT Enhanced v2.0.0 — Side Panel
// Single consolidated class with full voice (STT + TTS), image gen, and integrations.

class SidePanelApp {
  constructor() {
    this.settings = {};
    this.chatHistory = [];
    this.conversationHistory = [];
    this.isRecording = false;
    this.recognition = null;
    this.synth = ('speechSynthesis' in window) ? window.speechSynthesis : null;
    this.ttsEnabled = true;
    this.autoSubmitVoice = false;
    this.init();
  }

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async init() {
    this.isRecording = false;
    await this.loadSettings();
    await this.loadChatHistory();
    this.applyTheme();
    this.setupEventListeners();
    this.initVoiceRecognition();
    this.renderChatHistory();
    this.updateModelSelector();
    this.updateSettingsModal();
    this.updateActionButtons();
  }

  // ---------------------------------------------------------------------------
  // Settings & Storage
  // ---------------------------------------------------------------------------

  async loadSettings() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
    if (response?.success) this.settings = response.data;
  }

  async saveSettings() {
    await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', data: this.settings });
  }

  async loadChatHistory() {
    const response = await chrome.runtime.sendMessage({ type: 'GET_CHAT_HISTORY' });
    if (response?.success) this.chatHistory = response.data;
  }

  async saveChatEntry(entry) {
    await chrome.runtime.sendMessage({ type: 'SAVE_CHAT_HISTORY', data: entry });
  }

  // ---------------------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------------------

  applyTheme() {
    document.body.classList.remove('light-mode', 'dark-mode', 'auto-theme');
    if (this.settings.theme === 'dark') document.body.classList.add('dark-mode');
    else if (this.settings.theme === 'light') document.body.classList.add('light-mode');
    else document.body.classList.add('auto-theme');
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------

  setupEventListeners() {
    // Tab nav
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', e => this.handleTabClick(e));
    });

    // Listen for messages from background (e.g. context menu translate, tab activation)
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'CONTEXT_TRANSLATE' && message.data?.text) {
        this.activateTranslateTab(message.data.text);
      }
      if (message.type === 'ACTIVATE_TAB') {
        document.querySelectorAll('.nav-tab').forEach(tab => {
          if (tab.dataset.tab === message.data.tab) tab.click();
        });
      }
    });

    // Chat
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    chatInput.addEventListener('input', () => this.toggleSendButton(chatInput, sendBtn));
    chatInput.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
    });
    sendBtn.addEventListener('click', () => this.sendChatMessage());

    // Model
    document.getElementById('model-select').addEventListener('change', e => this.handleModelChange(e));

    // Voice button
    document.getElementById('voice-btn').addEventListener('click', () => {
      if (this.isRecording) this.stopVoiceRecognition();
      else this.startVoiceRecognition();
    });

    // TTS toggle
    document.getElementById('tts-btn')?.addEventListener('click', () => this.toggleTTS());

    // Auto-submit toggle
    document.getElementById('auto-submit-toggle')?.addEventListener('click', () => this.toggleAutoSubmit());

    // Translate
    document.getElementById('swap-languages').addEventListener('click', () => this.swapLanguages());
    document.getElementById('translate-btn').addEventListener('click', () => this.translateText());
    document.getElementById('copy-translation').addEventListener('click', () => this.copyTranslation());
    document.getElementById('translate-input').addEventListener('input', () => this.toggleTranslateButton());

    // History
    document.getElementById('clear-history').addEventListener('click', () => this.clearChatHistory());

    // Image generation
    document.getElementById('generate-image-btn').addEventListener('click', () => this.generateImage());
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', e => this.handleStylePresetClick(e));
    });

    // Integrations
    document.getElementById('connect-sheets').addEventListener('click', () => this.connectService('sheets'));
    document.getElementById('connect-notion').addEventListener('click', () => this.connectService('notion'));
    document.getElementById('connect-trello').addEventListener('click', () => this.connectService('trello'));
    document.getElementById('export-to-sheets').addEventListener('click', () => this.exportToSheets());
    document.getElementById('save-to-notion').addEventListener('click', () => this.saveToNotion());
    document.getElementById('create-trello-card').addEventListener('click', () => this.createTrelloCard());

    // Settings modal
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
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    if (!message) return;

    const selectedModel = document.getElementById('model-select').value;

    this.addMessageToChat('user', message);
    this.conversationHistory.push({ role: 'user', content: message });
    chatInput.value = '';
    this.toggleSendButton(chatInput, document.getElementById('send-btn'));

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'CHAT_REQUEST',
        data: { message, model: selectedModel, conversationHistory: this.conversationHistory }
      });

      if (response?.success) {
        const aiText = typeof response.data === 'string' ? response.data : response.data.response;
        this.addMessageToChat('ai', aiText, selectedModel);
        this.conversationHistory.push({ role: 'assistant', content: aiText });
        this.saveChatEntry({ type: 'chat', request: message, response: aiText, model: selectedModel });
        this.speakText(aiText);
      } else {
        this.addMessageToChat('ai', `Error: ${response?.error || 'Unknown error'}`, 'system');
      }
    } catch (error) {
      this.addMessageToChat('ai', `Error: ${error.message}`, 'system');
    }
  }

  addMessageToChat(sender, text, model = '') {
    const chatMessages = document.getElementById('chat-messages');
    const bubble = document.createElement('div');
    bubble.classList.add('message-bubble', sender);

    const content = document.createElement('div');
    content.classList.add('message-content');
    content.textContent = text;

    bubble.appendChild(content);
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  handleModelChange(event) {
    const model = event.target.value;
    const indicator = document.getElementById('provider-indicator');
    if (!indicator) return;
    if (model.includes('claude')) indicator.textContent = 'Anthropic';
    else if (model.includes('gemini')) indicator.textContent = 'Google';
    else if (model.includes('llama')) indicator.textContent = 'Ollama';
    else indicator.textContent = 'OpenAI';
  }

  updateModelSelector() {
    const modelSelect = document.getElementById('model-select');
    const indicator = document.getElementById('provider-indicator');
    if (!modelSelect || !indicator) return;
    const model = modelSelect.value;
    if (model.includes('claude')) indicator.textContent = 'Anthropic';
    else if (model.includes('gemini')) indicator.textContent = 'Google';
    else if (model.includes('llama')) indicator.textContent = 'Ollama';
    else indicator.textContent = 'OpenAI';
  }

  // ---------------------------------------------------------------------------
  // Voice — Speech-to-Text (refined)
  // ---------------------------------------------------------------------------

  initVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const voiceBtn = document.getElementById('voice-btn');

    if (!SpeechRecognition) {
      if (voiceBtn) {
        voiceBtn.disabled = true;
        voiceBtn.title = 'Speech recognition not supported in this browser';
        voiceBtn.classList.add('unsupported');
      }
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;       // multi-sentence dictation
    this.recognition.interimResults = true;   // stream partial results live
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      voiceBtn?.classList.add('recording');
      document.getElementById('chat-input')?.classList.add('listening');
    };

    this.recognition.onresult = (event) => {
      let interim = '';
      let final = '';
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
      if (interim && interimEl) {
        interimEl.textContent = interim;
      }
    };

    this.recognition.onerror = (event) => {
      const msgs = {
        'not-allowed': 'Microphone access denied — check browser permissions.',
        'no-speech': 'No speech detected. Try again.',
        'network': 'Network error during recognition.',
        'audio-capture': 'No microphone found on this device.',
      };
      console.warn('Voice error:', msgs[event.error] || event.error);
      this.stopVoiceRecognition();
    };

    this.recognition.onend = () => {
      this.isRecording = false;
      voiceBtn?.classList.remove('recording');
      document.getElementById('chat-input')?.classList.remove('listening');
      const interimEl = document.getElementById('interim-transcript');
      if (interimEl) interimEl.textContent = '';

      // Auto-submit if enabled and there's content
      if (this.autoSubmitVoice) {
        const chatInput = document.getElementById('chat-input');
        if (chatInput?.value.trim()) {
          document.getElementById('send-btn')?.click();
        }
      }
    };
  }

  startVoiceRecognition() {
    if (this.recognition && !this.isRecording) {
      try {
        this.isRecording = true;
        this.recognition.start();
      } catch (e) {
        console.error('Error starting recognition:', e);
        this.isRecording = false;
      }
    }
  }

  stopVoiceRecognition() {
    if (this.recognition && this.isRecording) {
      this.isRecording = false;
      this.recognition.stop();
    }
    document.getElementById('voice-btn')?.classList.remove('recording');
    document.getElementById('chat-input')?.classList.remove('listening');
    const interimEl = document.getElementById('interim-transcript');
    if (interimEl) interimEl.textContent = '';
  }

  // ---------------------------------------------------------------------------
  // Voice — Text-to-Speech
  // ---------------------------------------------------------------------------

  speakText(text) {
    if (!this.synth || !this.ttsEnabled || !text) return;
    this.synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.onerror = () => {}; // suppress uncaught errors
    this.synth.speak(utterance);
  }

  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    if (this.synth && !this.ttsEnabled) this.synth.cancel();
    const btn = document.getElementById('tts-btn');
    btn?.classList.toggle('muted', !this.ttsEnabled);
    btn?.setAttribute('title', this.ttsEnabled ? 'Mute AI voice' : 'Unmute AI voice');
  }

  toggleAutoSubmit() {
    this.autoSubmitVoice = !this.autoSubmitVoice;
    const toggle = document.getElementById('auto-submit-toggle');
    toggle?.classList.toggle('active', this.autoSubmitVoice);
  }

  // ---------------------------------------------------------------------------
  // Translate
  // ---------------------------------------------------------------------------

  swapLanguages() {
    const src = document.getElementById('source-lang');
    const tgt = document.getElementById('target-lang');
    [src.value, tgt.value] = [tgt.value, src.value];
  }

  async translateText() {
    const text = document.getElementById('translate-input').value.trim();
    if (!text) return;

    const sourceLang = document.getElementById('source-lang').value;
    const targetLang = document.getElementById('target-lang').value;
    const translateBtn = document.getElementById('translate-btn');
    const output = document.getElementById('translate-output');
    const copyBtn = document.getElementById('copy-translation');

    translateBtn.disabled = true;
    output.innerHTML = '<div class="placeholder">Translating...</div>';
    copyBtn.style.display = 'none';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TRANSLATE_REQUEST',
        data: { text, sourceLanguage: sourceLang, targetLanguage: targetLang }
      });

      if (response?.success) {
        output.textContent = response.data.translatedText;
        copyBtn.style.display = 'inline-flex';
        this.saveChatEntry({ type: 'translate', request: text, response: response.data.translatedText, source: sourceLang, target: targetLang });
      } else {
        output.textContent = `Error: ${response?.error || 'Unknown error'}`;
      }
    } catch (error) {
      output.textContent = `Error: ${error.message}`;
    } finally {
      translateBtn.disabled = false;
    }
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
      if (entry.type === 'chat') {
        type = `Chat (${entry.model})`;
        content = `**You:** ${entry.request}\n**AI:** ${entry.response}`;
      } else if (entry.type === 'translate') {
        type = `Translate (${entry.source} → ${entry.target})`;
        content = `**Original:** ${entry.request}\n**Translated:** ${entry.response}`;
      } else if (entry.type === 'image_generation') {
        type = `Image (${entry.model})`;
        content = `**Prompt:** ${entry.request}`;
      }

      item.innerHTML = `
        <div class="history-item-header">
          <span class="type">${type}</span>
          <span class="date">${new Date(entry.timestamp).toLocaleString()}</span>
        </div>
        <div class="history-item-content">${content}</div>`;
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
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    const check = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
    set('openai-key', this.settings.openaiApiKey);
    set('anthropic-key', this.settings.anthropicApiKey);
    set('google-key', this.settings.googleApiKey);
    set('ollama-url', this.settings.ollamaUrl || 'http://localhost:11434');
    set('theme-select', this.settings.theme || 'auto');
    check('auto-translate', this.settings.autoTranslate);
    set('slack-webhook-url', this.settings.slackWebhookUrl);
    set('slack-chart-url', this.settings.slackChartUrl);
    set('sheets-key', this.settings.sheetsApiKey);
    set('notion-token', this.settings.notionToken);
    set('trello-key', this.settings.trelloApiKey);
    set('trello-token', this.settings.trelloToken);
  }

  async saveSettingsAndCloseModal() {
    const get = id => document.getElementById(id)?.value || '';
    const getCheck = id => document.getElementById(id)?.checked || false;
    this.settings = {
      ...this.settings,
      openaiApiKey: get('openai-key'),
      anthropicApiKey: get('anthropic-key'),
      googleApiKey: get('google-key'),
      ollamaUrl: get('ollama-url'),
      theme: get('theme-select'),
      autoTranslate: getCheck('auto-translate'),
      slackWebhookUrl: get('slack-webhook-url'),
      slackChartUrl: get('slack-chart-url'),
      sheetsApiKey: get('sheets-key'),
      notionToken: get('notion-token'),
      trelloApiKey: get('trello-key'),
      trelloToken: get('trello-token'),
    };
    await this.saveSettings();
    this.applyTheme();
    this.closeSettingsModal();
  }

  // ---------------------------------------------------------------------------
  // Image Generation
  // ---------------------------------------------------------------------------

  async generateImage() {
    const prompt = document.getElementById('image-prompt-input').value.trim();
    if (!prompt) return;

    const selectedModel = document.getElementById('image-model-select').value;
    const generateBtn = document.getElementById('generate-image-btn');
    const preview = document.getElementById('generated-image-preview');
    const downloadBtn = document.getElementById('download-image-btn');

    generateBtn.disabled = true;
    preview.innerHTML = '<div class="placeholder">Generating image...</div>';
    downloadBtn.style.display = 'none';

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GENERATE_IMAGE_REQUEST',
        data: { prompt, model: selectedModel }
      });

      if (response?.success) {
        const url = response.data.imageUrl;
        preview.innerHTML = `<img src="${url}" alt="Generated Image">`;
        downloadBtn.href = url;
        downloadBtn.download = 'generated-image.png';
        downloadBtn.style.display = 'inline-flex';
        this.saveChatEntry({ type: 'image_generation', request: prompt, response: url, model: selectedModel });
      } else {
        preview.innerHTML = `<div class="placeholder">Error: ${response?.error || 'Unknown error'}</div>`;
      }
    } catch (error) {
      preview.innerHTML = `<div class="placeholder">Error: ${error.message}</div>`;
    } finally {
      generateBtn.disabled = false;
    }
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
    const keyMap = {
      sheets: { key: 'sheetsApiKey', msg: 'Google Sheets API key' },
      notion: { key: 'notionToken', msg: 'Notion integration token' },
      trello: { key: 'trelloApiKey', msg: 'Trello API key' },
    };

    const cfg = keyMap[service];
    if (!this.settings[cfg.key]) {
      alert(`Please configure your ${cfg.msg} in Settings first.`);
      return;
    }

    const card = document.querySelector(`[data-service="${service}"]`);
    const btn = card?.querySelector('.connect-btn');
    card?.classList.add('connected');
    if (btn) { btn.textContent = 'Connected'; btn.classList.add('connected'); }
    this.updateActionButtons();
  }

  updateActionButtons() {
    const connected = s => document.querySelector(`[data-service="${s}"]`)?.classList.contains('connected');
    const disable = (id, val) => { const el = document.getElementById(id); if (el) el.disabled = !val; };
    disable('export-to-sheets', connected('sheets'));
    disable('save-to-notion', connected('notion'));
    disable('create-trello-card', connected('trello'));
  }

  async exportToSheets() {
    const history = await chrome.runtime.sendMessage({ type: 'GET_CHAT_HISTORY' });
    if (!history?.data?.length) { alert('No chat history to export.'); return; }
    const response = await chrome.runtime.sendMessage({ type: 'EXPORT_TO_SHEETS', data: { history: history.data } });
    alert(response?.success ? 'Exported to Google Sheets!' : `Failed: ${response?.error}`);
  }

  async saveToNotion() {
    const last = this.chatHistory[this.chatHistory.length - 1];
    if (!last) { alert('No recent conversation to save.'); return; }
    const response = await chrome.runtime.sendMessage({ type: 'SAVE_TO_NOTION', data: { chat: last } });
    alert(response?.success ? 'Saved to Notion!' : `Failed: ${response?.error}`);
  }

  async createTrelloCard() {
    const last = this.chatHistory[this.chatHistory.length - 1];
    if (!last) { alert('No recent conversation to create a card from.'); return; }
    const response = await chrome.runtime.sendMessage({ type: 'CREATE_TRELLO_CARD', data: { chat: last } });
    alert(response?.success ? 'Trello card created!' : `Failed: ${response?.error}`);
  }
}

document.addEventListener('DOMContentLoaded', () => new SidePanelApp());
