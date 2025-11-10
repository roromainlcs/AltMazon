let request_sent = false;

chrome.runtime.onMessage.addListener(async (msg, _sender, _sendResponse) => {
  if (msg?.type === "open_popup") {
    // Requires Chrome 127+ for general extensions.
    await chrome.action.openPopup().catch(err => {
      // Optional: fallback UX if popup can’t open (e.g., not pinned)
      console.warn("openPopup failed:", err);
      return;
    });
    await chrome.storage.local.set({ view: "altShops" });
  }
});