/*
 * FRONTEND ONLY:
 * This shared file provides the same loading state across every ThriftBuild page.
 * Use showLoadingState(message) before an asynchronous request and hideLoadingState()
 * after it finishes, whether it succeeds or fails.
 */

(function createLoadingState() {
  const loadingState = document.createElement("div");
  const loadingPanel = document.createElement("div");
  const loadingSpinner = document.createElement("span");
  const loadingMessage = document.createElement("p");
  const loadingSubmessage = document.createElement("p");

  loadingState.id = "loading-state";
  loadingState.hidden = true;
  loadingState.setAttribute("role", "status");
  loadingState.setAttribute("aria-live", "polite");
  loadingState.setAttribute("aria-label", "Loading");

  loadingPanel.id = "loading-panel";
  loadingSpinner.id = "loading-spinner";
  loadingSpinner.setAttribute("aria-hidden", "true");
  loadingMessage.id = "loading-message";
  loadingMessage.textContent = "Loading...";
  loadingSubmessage.id = "loading-submessage";
  loadingSubmessage.textContent = "Please wait a moment";

  loadingPanel.append(loadingSpinner, loadingMessage, loadingSubmessage);
  loadingState.append(loadingPanel);
  document.body.append(loadingState);

  window.showLoadingState = function showLoadingState(message) {
    loadingMessage.textContent = message || "Loading...";
    loadingState.hidden = false;
    document.body.setAttribute("aria-busy", "true");
  };

  window.hideLoadingState = function hideLoadingState() {
    loadingState.hidden = true;
    document.body.removeAttribute("aria-busy");
  };

  // FRONTEND: A browser Back action can restore a page with its old visible loader.
  window.addEventListener("pageshow", () => {
    window.hideLoadingState();
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;

    if (!event.defaultPrevented && form.matches("form[data-show-loading]")) {
      window.showLoadingState(form.dataset.loadingMessage);
    }
  });
})();

// BACKEND: Reuse window.showLoadingState() and window.hideLoadingState() around API requests.

// FRONTEND JAVASCRIPT ENDS HERE.
