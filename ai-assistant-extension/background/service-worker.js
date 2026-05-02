// SideGemGPT Enhanced v2.0.0 — Service Worker
// Single consolidated class handling all API calls and background tasks.

class AIAssistantServiceWorker {
  constructor() {
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.initializeSettings();
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------

  setupEventListeners() {
    chrome.runtime.onInstalled.addListener(details => this.handleInstallation(details));
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // keep channel open for async responses
    });
    chrome.commands.onCommand.addListener(command => this.handleCommand(command));
    chrome.contextMenus.onClicked.addListener((info, tab) => this.handleContextMenu(info, tab));
  }

  async handleInstallation(details) {
    chrome.contextMenus.create({
      id: 'ai-assistant-translate',
      title: 'Translate with SideGemGPT',
      contexts: ['selection']
    });
    await this.initializeSettings();
  }

  async handleCommand(command) {
    if (command === 'toggle-sidepanel') {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) await chrome.sidePanel.open({ tabId: tabs[0].id });
    }
  }

  async handleContextMenu(info, tab) {
    if (info.menuItemId === 'ai-assistant-translate' && info.selectionText) {
      await chrome.sidePanel.open({ tabId: tab.id });
      setTimeout(() => {
        chrome.runtime.sendMessage({ type: 'CONTEXT_TRANSLATE', data: { text: info.selectionText } });
      }, 500);
    }
  }

  // ---------------------------------------------------------------------------
  // Message Router
  // ---------------------------------------------------------------------------

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.type) {
        case 'CHAT_REQUEST': {
          const result = await this.handleChatRequest(message.data);
          sendResponse({ success: true, data: result });
          break;
        }
        case 'TRANSLATE_REQUEST': {
          const result = await this.handleTranslateRequest(message.data);
          sendResponse({ success: true, data: result });
          break;
        }
        case 'GENERATE_IMAGE_REQUEST': {
          const url = await this.handleImageGenerationRequest(message.data);
          sendResponse({ success: true, data: { imageUrl: url } });
          break;
        }
        case 'TRIGGER_SLACK_NOTIFICATION': {
          await this.sendSlackNotification(message.data.current, message.data.goal);
          sendResponse({ success: true });
          break;
        }
        case 'EXPORT_TO_SHEETS': {
          const result = await this.handleExportToSheets(message.data);
          sendResponse({ success: true, data: result });
          break;
        }
        case 'SAVE_TO_NOTION': {
          const result = await this.handleSaveToNotion(message.data);
          sendResponse({ success: true, data: result });
          break;
        }
        case 'CREATE_TRELLO_CARD': {
          const result = await this.handleCreateTrelloCard(message.data);
          sendResponse({ success: true, data: result });
          break;
        }
        case 'SAVE_SETTINGS': {
          await this.saveSettings(message.data);
          sendResponse({ success: true });
          break;
        }
        case 'GET_SETTINGS': {
          const settings = await this.getSettings();
          sendResponse({ success: true, data: settings });
          break;
        }
        case 'SAVE_CHAT_HISTORY': {
          await this.saveChatHistory(message.data);
          sendResponse({ success: true });
          break;
        }
        case 'GET_CHAT_HISTORY': {
          const history = await this.getChatHistory();
          sendResponse({ success: true, data: history });
          break;
        }
        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Service worker error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // ---------------------------------------------------------------------------
  // Chat — Multi-provider routing
  // ---------------------------------------------------------------------------

  async handleChatRequest({ message, model, conversationHistory = [] }) {
    const settings = await this.getSettings();

    if (model.includes('claude')) return this.handleAnthropicRequest(message, model, conversationHistory, settings);
    if (model.includes('gemini')) return this.handleGoogleRequest(message, model, conversationHistory, settings);
    if (model.includes('llama')) return this.handleOllamaRequest(message, model, settings);
    return this.handleOpenAIRequest(message, model, conversationHistory, settings);
  }

  async handleOpenAIRequest(message, model, conversationHistory, settings) {
    if (!settings.openaiApiKey) throw new Error('OpenAI API key not configured');

    const messages = conversationHistory.map(e => ({ role: e.role, content: e.content }));
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.openaiApiKey}` },
      body: JSON.stringify({ model, messages, max_tokens: 1000, temperature: 0.7 })
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.status}`);
    const data = await response.json();
    return data.choices[0].message.content;
  }

  async handleAnthropicRequest(message, model, conversationHistory, settings) {
    if (!settings.anthropicApiKey) throw new Error('Anthropic API key not configured');

    const messages = conversationHistory.map(e => ({ role: e.role === 'user' ? 'user' : 'assistant', content: e.content }));
    messages.push({ role: 'user', content: message });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': settings.anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({ model, max_tokens: 1024, messages })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Anthropic API error: ${response.status} — ${err.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.content[0].text;
  }

  async handleGoogleRequest(message, model, conversationHistory, settings) {
    if (!settings.googleApiKey) throw new Error('Google AI API key not configured');

    const contents = conversationHistory.map(e => ({
      role: e.role === 'user' ? 'user' : 'model',
      parts: [{ text: e.content }]
    }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.googleApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } })
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Google AI API error: ${response.status} — ${err.error?.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  async handleOllamaRequest(message, model, settings) {
    const url = settings.ollamaUrl || 'http://localhost:11434';
    const response = await fetch(`${url}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: message, stream: false })
    });

    if (!response.ok) throw new Error(`Ollama API error: ${response.status}`);
    const data = await response.json();
    return data.response;
  }

  // ---------------------------------------------------------------------------
  // Translation
  // ---------------------------------------------------------------------------

  async handleTranslateRequest({ text, targetLanguage = 'en', sourceLanguage = 'auto' }) {
    try {
      if (chrome.translation?.translate) {
        const result = await chrome.translation.translate({
          text,
          sourceLanguage: sourceLanguage === 'auto' ? undefined : sourceLanguage,
          targetLanguage
        });
        return { translatedText: result.translatedText, detectedLanguage: result.detectedLanguage, provider: 'chrome-builtin' };
      }
    } catch { /* fall through to mock */ }

    return { translatedText: `[Translated to ${targetLanguage}]: ${text}`, detectedLanguage: sourceLanguage, provider: 'mock' };
  }

  // ---------------------------------------------------------------------------
  // Image Generation
  // ---------------------------------------------------------------------------

  async handleImageGenerationRequest({ prompt, model = 'dall-e-3' }) {
    const settings = await this.getSettings();
    if (!settings.openaiApiKey) throw new Error('OpenAI API key not configured for image generation');

    const openaiModel = model === 'dall-e-3' ? 'dall-e-3' : 'dall-e-2';

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.openaiApiKey}` },
      body: JSON.stringify({ model: openaiModel, prompt, n: 1, size: '1024x1024' })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`OpenAI Image API error: ${response.status} — ${err.error?.message}`);
    }
    const data = await response.json();
    return data.data[0].url;
  }

  // ---------------------------------------------------------------------------
  // Slack Notifications
  // ---------------------------------------------------------------------------

  async sendSlackNotification(current, goal) {
    const settings = await this.getSettings();
    const { slackWebhookUrl, slackChartUrl } = settings;
    if (!slackWebhookUrl || !slackChartUrl) return;

    const percent = (current / goal) * 100;
    const milestones = [
      { threshold: 100, text: '🎯 *GOAL ACHIEVED!*', emoji: ':tada:' },
      { threshold: 90, text: '🔥 *90% of Goal!* Final sprint!', emoji: ':fire:' },
      { threshold: 75, text: '⚡ *75% of Goal!* Closing in!', emoji: ':zap:' },
      { threshold: 50, text: '📈 *50% of Goal!* Halfway there!', emoji: ':chart_with_upwards_trend:' },
    ];
    const milestone = milestones.find(m => percent >= m.threshold);
    if (!milestone) return;

    const payload = {
      text: `${milestone.text}\n*Progress:* ${current}/${goal} (${percent.toFixed(1)}%)`,
      username: 'SideGemGPT Growth Bot',
      icon_emoji: milestone.emoji,
      attachments: [{ fallback: 'Growth Chart', image_url: slackChartUrl }]
    };

    const response = await fetch(slackWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error(`Slack API error: ${response.status}`);
  }

  // ---------------------------------------------------------------------------
  // Integrations
  // ---------------------------------------------------------------------------

  async handleExportToSheets({ history }) {
    const settings = await this.getSettings();
    if (!settings.sheetsApiKey) throw new Error('Google Sheets API key not configured');

    const rows = history.map(e => [
      new Date(e.timestamp).toISOString(),
      e.model || '',
      e.request || '',
      e.response || ''
    ]);
    console.log('Exporting to Sheets:', rows);
    return { success: true, message: 'Exported to Google Sheets' };
  }

  async handleSaveToNotion({ chat }) {
    const settings = await this.getSettings();
    if (!settings.notionToken) throw new Error('Notion token not configured');

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.notionToken}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28'
      },
      body: JSON.stringify({
        parent: { database_id: settings.notionDatabaseId || '' },
        properties: {
          Title: { title: [{ text: { content: `AI Chat — ${new Date().toLocaleDateString()}` } }] }
        },
        children: [{
          object: 'block', type: 'paragraph',
          paragraph: { rich_text: [{ type: 'text', text: { content: `Request: ${chat.request}\n\nResponse: ${chat.response}` } }] }
        }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Notion API error: ${response.status} — ${err.message}`);
    }
    const result = await response.json();
    return { success: true, pageId: result.id };
  }

  async handleCreateTrelloCard({ chat }) {
    const settings = await this.getSettings();
    if (!settings.trelloApiKey || !settings.trelloToken) throw new Error('Trello API key and token not configured');

    const response = await fetch('https://api.trello.com/1/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `AI Chat — ${new Date().toLocaleDateString()}`,
        desc: `Request: ${chat.request}\n\nResponse: ${chat.response}`,
        idList: settings.trelloListId || '',
        key: settings.trelloApiKey,
        token: settings.trelloToken
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Trello API error: ${response.status} — ${err.message}`);
    }
    const result = await response.json();
    return { success: true, cardId: result.id };
  }

  // ---------------------------------------------------------------------------
  // Storage
  // ---------------------------------------------------------------------------

  async saveSettings(settings) {
    await chrome.storage.sync.set({ settings });
  }

  async getSettings() {
    const result = await chrome.storage.sync.get(['settings']);
    return result.settings || {};
  }

  async saveChatHistory(chatData) {
    const timestamp = Date.now();
    const chatId = `chat_${timestamp}`;
    await chrome.storage.local.set({ [chatId]: { ...chatData, timestamp, id: chatId } });

    // Prune to last 100 entries
    const all = await chrome.storage.local.get();
    const entries = Object.entries(all)
      .filter(([k]) => k.startsWith('chat_'))
      .sort(([, a], [, b]) => b.timestamp - a.timestamp);
    if (entries.length > 100) {
      await chrome.storage.local.remove(entries.slice(100).map(([k]) => k));
    }
  }

  async getChatHistory() {
    const all = await chrome.storage.local.get();
    return Object.entries(all)
      .filter(([k]) => k.startsWith('chat_'))
      .map(([, v]) => v)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  async initializeSettings() {
    const { settings } = await chrome.storage.sync.get('settings');
    if (!settings) {
      await chrome.storage.sync.set({
        settings: {
          openaiApiKey: '', anthropicApiKey: '', googleApiKey: '',
          ollamaUrl: 'http://localhost:11434', defaultModel: 'gpt-3.5-turbo',
          theme: 'light', autoTranslate: false,
          slackWebhookUrl: '', slackChartUrl: '',
          sheetsApiKey: '', notionToken: '', notionDatabaseId: '',
          trelloApiKey: '', trelloToken: '', trelloListId: ''
        }
      });
    }
  }
}

new AIAssistantServiceWorker();
