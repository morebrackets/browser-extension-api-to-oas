const debuggees = new Set();
const requests = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TOGGLE_DEBUGGER') {
    const tabId = message.tabId;
    if (debuggees.has(tabId)) {
      chrome.debugger.detach({ tabId });
    } else {
      chrome.debugger.attach({ tabId }, '1.3', () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          return;
        }
        debuggees.add(tabId);
        chrome.debugger.sendCommand({ tabId }, 'Network.enable');
      });
    }
    sendResponse({ isDebugging: !debuggees.has(tabId) });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({ isDebugging: debuggees.has(message.tabId) });
  }
});

chrome.debugger.onEvent.addListener((source, method, params) => {
  const tabId = source.tabId;
  if (!debuggees.has(tabId)) return;

  if (method === 'Network.requestWillBeSent') {
    requests[params.requestId] = {
      request: params.request,
    };
  }

  if (method === 'Network.responseReceived') {
    requests[params.requestId].response = params.response;
    chrome.debugger.sendCommand(
      { tabId },
      'Network.getResponseBody',
      { requestId: params.requestId },
      (response) => {
        if (response && response.body) {
            requests[params.requestId].response.body = response.body;
        }
        saveRequest(requests[params.requestId]);
        delete requests[params.requestId];
      }
    );
  }
});

chrome.debugger.onDetach.addListener((source) => {
  debuggees.delete(source.tabId);
});

function saveRequest(requestData) {
    // A simple filter to only save XHR/fetch requests
    if (requestData.request.url.startsWith('http')) {
        chrome.storage.local.get({ requests: [] }, (result) => {
            const storedRequests = result.requests;
            const newRequest = {
                url: requestData.request.url,
                method: requestData.request.method,
                requestHeaders: requestData.request.headers,
                requestBody: requestData.request.postData,
                status: requestData.response.status,
                responseHeaders: requestData.response.headers,
                responseBody: requestData.response.body,
            };
            storedRequests.push(newRequest);
            chrome.storage.local.set({ requests: storedRequests });
        });
    }
}
