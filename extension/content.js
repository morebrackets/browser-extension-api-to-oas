(function() {
  console.log("API to OAS content script loaded and active.");

  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    console.log("API to OAS: intercepted fetch request.");
    const [url, config] = args;
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();

    const requestData = {
      url: url.toString(),
      method: config ? config.method || 'GET' : 'GET',
    };

    clonedResponse.text().then(responseText => {
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch (e) {
        responseBody = responseText;
      }

      const message = {
        type: 'API_REQUEST',
        data: {
          ...requestData,
          responseBody: responseBody,
          status: clonedResponse.status,
          responseHeaders: Object.fromEntries(clonedResponse.headers.entries()),
        },
      };
      console.log("API to OAS: sending fetch data to background", message);
      chrome.runtime.sendMessage(message);
    });

    return response;
  };

  const originalXhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body) {
    console.log("API to OAS: intercepted XHR request.");
    const xhr = this;
    const originalOpen = xhr.open;

    xhr.open = function(method, url) {
      xhr._method = method;
      xhr._url = url;
      originalOpen.apply(xhr, arguments);
    };

    this.addEventListener('load', function() {
      let requestBody;
      try {
        requestBody = JSON.parse(body);
      } catch (e) {
        requestBody = body;
      }

      let responseBody;
      try {
        responseBody = JSON.parse(xhr.responseText);
      } catch (e) {
        responseBody = xhr.responseText;
      }

      const responseHeaders = {};
      const headers = xhr.getAllResponseHeaders();
      if (headers) {
          const arr = headers.trim().split(/[\r\n]+/);
          arr.forEach(line => {
              const parts = line.split(': ');
              const header = parts.shift();
              const value = parts.join(': ');
              responseHeaders[header] = value;
          });
      }

      const message = {
        type: 'API_REQUEST',
        data: {
          url: xhr._url,
          method: xhr._method,
          requestBody: requestBody,
          responseBody: responseBody,
          status: xhr.status,
          responseHeaders: responseHeaders,
        },
      };
      console.log("API to OAS: sending XHR data to background", message);
      chrome.runtime.sendMessage(message);
    });

    originalXhrSend.apply(this, arguments);
  };
})();
