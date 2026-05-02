// AI Assistant Chrome Extension - Popup JavaScript
// Handles popup UI interactions and communication with the service worker

class PopupApp {
  constructor() {
    this.settings = {};
    this.init();
  }

  async init() {
    console.log("Popup app initializing...");
    await this.loadSettings();
    this.applyTheme();
    this.setupEventListeners();
    this.updateStatusText();
    console.log("Popup app initialized.");
  }

  async loadSettings() {
    const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
    if (response && response.success) {
      this.settings = response.data;
    } else {
      console.error("Failed to load settings:", response?.error);
    }
  }

  applyTheme() {
    document.body.classList.remove("light-mode", "dark-mode", "auto-theme");
    if (this.settings.theme === "dark") {
      document.body.classList.add("dark-mode");
    } else if (this.settings.theme === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.add("auto-theme");
    }
  }

  setupEventListeners() {
    document.getElementById("open-sidepanel-btn").addEventListener("click", () => this.openSidePanel());
    document.getElementById("quick-chat-btn").addEventListener("click", () => this.quickChat());
    document.getElementById("quick-translate-btn").addEventListener("click", () => this.quickTranslate());
    document.getElementById("quick-generate-btn").addEventListener("click", () => this.quickGenerateImage());
    document.getElementById("settings-btn").addEventListener("click", () => this.openSidePanelAndSettings());
  }

  updateStatusText() {
    const statusText = document.getElementById("status-text");
    if (this.settings.openaiApiKey) {
      statusText.textContent = "OpenAI configured.";
    } else {
      statusText.textContent = "OpenAI API key missing. Go to Settings.";
    }
  }

  async openSidePanel() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        await chrome.sidePanel.open({ tabId: tabs[0].id });
        window.close(); // Close popup after opening side panel
      }
    } catch (error) {
      console.error("Error opening side panel:", error);
    }
  }

  async quickChat() {
    await this.openSidePanel();
    // Optionally send a message to the side panel to activate the chat tab
    chrome.runtime.sendMessage({ type: "ACTIVATE_TAB", data: { tab: "chat" } });
  }

  async quickTranslate() {
    await this.openSidePanel();
    // Optionally send a message to the side panel to activate the translate tab
    chrome.runtime.sendMessage({ type: "ACTIVATE_TAB", data: { tab: "translate" } });
  }

  async openSidePanelAndSettings() {
    await this.openSidePanel();
    // Optionally send a message to the side panel to open settings modal
    chrome.runtime.sendMessage({ type: "OPEN_SETTINGS_MODAL" });
  }
}

// Initialize popup when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new PopupApp();
});



  async quickGenerateImage() {
    await this.openSidePanel();
    chrome.runtime.sendMessage({ type: "ACTIVATE_TAB", data: { tab: "generate" } });
  }


