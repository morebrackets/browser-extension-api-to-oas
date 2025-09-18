chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'API_REQUEST') {
    chrome.tabs.get(sender.tab.id, (tab) => {
      if (tab && tab.url) {
        const tabUrl = new URL(tab.url);
        const requestUrl = new URL(message.data.url, tabUrl.origin);

        if (requestUrl.hostname.endsWith(tabUrl.hostname)) {
          chrome.storage.local.get({ requests: [] }, (result) => {
            const requests = result.requests;
            requests.push(message.data);
            chrome.storage.local.set({ requests });
          });
        }
      }
    });
  }
});
