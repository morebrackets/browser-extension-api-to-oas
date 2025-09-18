console.log("API to OAS background script loaded.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("API to OAS: background script received message", message);
  if (message.type === 'API_REQUEST') {
    if (!sender.tab) {
        console.log("API to OAS: message from non-tab context, ignoring.");
        return;
    }
    chrome.tabs.get(sender.tab.id, (tab) => {
      if (chrome.runtime.lastError) {
        console.error("API to OAS: " + chrome.runtime.lastError.message);
        return;
      }

      if (tab && tab.url) {
        console.log("API to OAS: processing message for tab", tab.url);
        const tabUrl = new URL(tab.url);
        const requestUrl = new URL(message.data.url, tabUrl.origin);

        console.log(`API to OAS: checking hostname match: req_host=${requestUrl.hostname}, tab_host=${tabUrl.hostname}`);
        if (requestUrl.hostname.endsWith(tabUrl.hostname)) {
          console.log("API to OAS: hostname matched, storing request.");
          chrome.storage.local.get({ requests: [] }, (result) => {
            const requests = result.requests;
            requests.push(message.data);
            chrome.storage.local.set({ requests }, () => {
                console.log("API to OAS: request stored successfully.");
            });
          });
        } else {
            console.log("API to OAS: hostname did not match, ignoring request.");
        }
      } else {
        console.log("API to OAS: could not get tab info, ignoring message.");
      }
    });
  }
});
