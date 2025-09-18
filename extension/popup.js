document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggle-capture");
  const generateBtn = document.getElementById("generate");
  const copyBtn = document.getElementById("copy");
  const clearBtn = document.getElementById("clear");
  const oasOutput = document.getElementById("oas-output");
  let currentTabId;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTabId = tabs[0].id;
    chrome.runtime.sendMessage({ type: 'GET_STATUS', tabId: currentTabId }, (response) => {
      updateButton(response.isDebugging);
    });
  });

  toggleBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_DEBUGGER', tabId: currentTabId }, (response) => {
      updateButton(response.isDebugging);
    });
  });

  function updateButton(isDebugging) {
    toggleBtn.textContent = isDebugging ? "Stop Capturing" : "Start Capturing";
    toggleBtn.style.backgroundColor = isDebugging ? "#f44336" : "#4CAF50";
    toggleBtn.style.color = "white";
  }

  generateBtn.addEventListener("click", () => {
    chrome.storage.local.get({ requests: [] }, (result) => {
      const oas = generateOAS(result.requests);
      oasOutput.value = JSON.stringify(oas, null, 2);
    });
  });

  copyBtn.addEventListener("click", () => {
    oasOutput.select();
    document.execCommand("copy");
  });

  clearBtn.addEventListener("click", () => {
    chrome.storage.local.set({ requests: [] }, () => {
      oasOutput.value = "";
      alert("Captured requests cleared!");
    });
  });

  function generateOAS(requests) {
    const oas = {
      openapi: '3.0.0',
      info: {
        title: 'API to OAS',
        version: '1.0.0',
        description: 'Generated from captured browser API requests.',
      },
      paths: {},
    };

    requests.forEach((req) => {
      const url = new URL(req.url);
      const path = url.pathname;
      const method = req.method.toLowerCase();

      if (!oas.paths[path]) {
        oas.paths[path] = {};
      }

      const operation = {
        summary: `Captured ${method.toUpperCase()} request to ${path}`,
        parameters: [],
        responses: {},
      };

      url.searchParams.forEach((value, name) => {
        operation.parameters.push({
          in: 'query',
          name: name,
          schema: { type: 'string' },
        });
      });

      if (req.requestBody) {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: generateSchema(JSON.parse(req.requestBody)),
            },
          },
        };
      }

      const status = req.status || '200';
      operation.responses[status] = {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: generateSchema(JSON.parse(req.responseBody || '{}')),
          },
        },
      };

      oas.paths[path][method] = operation;
    });

    return oas;
  }

  function generateSchema(obj) {
    if (obj === null || obj === undefined) return {};
    const type = typeof obj;

    if (type === 'object' && Array.isArray(obj)) {
      return {
        type: 'array',
        items: obj.length > 0 ? generateSchema(obj[0]) : {},
      };
    }

    if (type === 'object') {
      const properties = {};
      for (const key in obj) {
        properties[key] = generateSchema(obj[key]);
      }
      return {
        type: 'object',
        properties: properties,
      };
    }

    return { type: type };
  }
});
