// Background Service Worker (Manifest V3)

// Register listeners synchronously at the top level
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Divine DevTools Extension installed/updated:', details.reason);
  
  // Set panel behavior to open on action button click
  // This is the standard Manifest V3 way for sidepanel
  if (chrome.sidePanel) {
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .then(() => {
        console.log('Sidepanel behavior configured successfully.');
      })
      .catch((error) => {
        console.error('Failed to configure sidepanel behavior:', error);
      });
  }
});

// We can listen to connection events if the content script or panel needs helper APIs
chrome.runtime.onConnect.addListener((port) => {
  console.log('Connected to port:', port.name);
  
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});
