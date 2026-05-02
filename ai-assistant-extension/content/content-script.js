// AI Assistant Chrome Extension - Content Script
// Injected into every webpage to interact with page content

class ContentScript {
  constructor() {
    this.init();
  }

  init() {
    console.log("AI Assistant content script initialized.");
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for messages from the background script or side panel
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "GET_SELECTED_TEXT") {
        sendResponse({ selectedText: window.getSelection().toString() });
      }
      // Add other message handlers for content script interactions
    });

    // Example: Automatically translate selected text if setting is enabled
    document.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }

  async handleMouseUp() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      const response = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" });
      if (response && response.success && response.data.autoTranslate) {
        // Send selected text to background script for translation
        chrome.runtime.sendMessage({
          type: "CONTEXT_TRANSLATE",
          data: { text: selectedText }
        });
      }
    }
  }
}

new ContentScript();

