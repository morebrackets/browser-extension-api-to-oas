function injectScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('injector.js');
  (document.head || document.documentElement).appendChild(script);
  script.onload = function() {
    script.remove();
  };
}

window.addEventListener('API_REQUEST', function(evt) {
  chrome.runtime.sendMessage({
    type: 'API_REQUEST',
    data: evt.detail,
  });
});

injectScript();
