/*
 * FRONTEND ONLY:
 * This file connects the Build PC interface to the existing Components page,
 * restores selections from sessionStorage, and updates the visible build totals.
 * Compatibility checks, trusted prices, saving, and cart actions remain backend work.
 */

const BUILD_STORAGE_KEY = "thriftBuildSelectedComponents";
const componentRows = document.querySelectorAll("#component-list > article");
const hideUnconfiguredCheckbox = document.querySelector("#hide-unconfigured");
const selectedCountLarge = document.querySelector("#selected-count-large");
const selectedCountSummary = document.querySelector("#selected-count-summary");
const componentsSubtotal = document.querySelector("#components-subtotal");
const buildServiceFee = document.querySelector("#build-service-fee");
const buildTotal = document.querySelector("#build-total");
const buildForm = document.querySelector("#build-form");
const buildFormError = document.querySelector("#build-form-error");
const addBuildToCartButton = document.querySelector("#add-build-to-cart");
const saveBuildButton = document.querySelector("#save-build");
const requirementMessage = document.querySelector("#build-requirement-message");

function readStoredComponents() {
  try {
    return JSON.parse(sessionStorage.getItem(BUILD_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

function parsePrice(priceText) {
  return Number(String(priceText).replace(/[^0-9.]/g, "")) || 0;
}

function formatPrice(price) {
  return `৳${price.toLocaleString("en-BD")}`;
}

function filterComponentRows() {
  const shouldHideUnconfigured = hideUnconfiguredCheckbox && hideUnconfiguredCheckbox.checked;

  componentRows.forEach((row) => {
    row.hidden = Boolean(shouldHideUnconfigured && row.dataset.selected !== "true");
  });
}

function requiredComponentsSelected() {
  const requiredRows = Array.from(componentRows).filter((row) => row.dataset.required === "true");

  return requiredRows.length > 0 && requiredRows.every((row) => row.dataset.selected === "true");
}

// FRONTEND: Restore each saved slot into only its matching component row.
function restoreStoredComponents() {
  const storedComponents = readStoredComponents();

  componentRows.forEach((row) => {
    const slot = row.dataset.componentType;
    const selectedProduct = storedComponents[slot];

    if (!selectedProduct || !selectedProduct.productId) {
      return;
    }

    const productIdInput = row.querySelector('[id$="-product-id"]');
    const selectionText = row.querySelector('[id$="-selection"]');
    const priceText = row.querySelector('[id$="-price"]');

    if (productIdInput) productIdInput.value = selectedProduct.productId;
    if (selectionText) selectionText.textContent = selectedProduct.productName;
    if (priceText) {
      priceText.textContent = selectedProduct.priceText || formatPrice(Number(selectedProduct.price) || 0);
    }
    row.dataset.selected = "true";
  });
}

// FRONTEND: Recalculate counts, totals, row labels, and action states.
function refreshBuildStatus() {
  componentRows.forEach((row) => {
    const productIdInput = row.querySelector('[id$="-product-id"]');
    row.dataset.selected = String(Boolean(productIdInput && productIdInput.value.trim()));
  });

  const selectedRows = Array.from(componentRows).filter((row) => row.dataset.selected === "true");
  const selectedCount = selectedRows.length;
  const subtotal = selectedRows.reduce((total, row) => {
    const priceText = row.querySelector('[id$="-price"]');
    return total + parsePrice(priceText ? priceText.textContent : 0);
  }, 0);
  const total = subtotal + parsePrice(buildServiceFee ? buildServiceFee.textContent : 0);

  componentRows.forEach((row) => {
    const chooseButton = row.querySelector('[id$="-choose-button"]');
    if (chooseButton) chooseButton.textContent = row.dataset.selected === "true" ? "Change" : "Choose";
  });

  if (selectedCountLarge) selectedCountLarge.textContent = selectedCount;
  if (selectedCountSummary) selectedCountSummary.textContent = selectedCount;
  if (componentsSubtotal) componentsSubtotal.textContent = formatPrice(subtotal);
  if (buildTotal) buildTotal.textContent = formatPrice(total);

  const requiredPartsSelected = requiredComponentsSelected();

  if (addBuildToCartButton) addBuildToCartButton.disabled = !requiredPartsSelected;
  if (saveBuildButton) saveBuildButton.disabled = selectedCount === 0;
  if (requirementMessage) requirementMessage.hidden = requiredPartsSelected;
  if (requiredPartsSelected && buildFormError) buildFormError.hidden = true;

  filterComponentRows();
}

// FRONTEND: Open Component.html with the component row's exact builder slot.
componentRows.forEach((row) => {
  const chooseButton = row.querySelector('[id$="-choose-button"]');

  if (chooseButton) {
    chooseButton.addEventListener("click", () => {
      const componentType = row.dataset.componentType;
      const parameters = new URLSearchParams({
        category: componentType,
        from: "builder",
        slot: componentType,
      });

      if (window.showLoadingState) {
        window.showLoadingState("Loading components...");
      }

      window.location.href = `Component.html?${parameters.toString()}`;
    });
  }
});

if (hideUnconfiguredCheckbox) {
  hideUnconfiguredCheckbox.addEventListener("change", filterComponentRows);
}

if (buildForm) {
  buildForm.addEventListener("submit", (event) => {
    const submittedAction = event.submitter ? event.submitter.value : "";

    if (submittedAction === "add_to_cart" && !requiredComponentsSelected()) {
      event.preventDefault();
      if (buildFormError) buildFormError.hidden = false;
      if (requirementMessage) requirementMessage.hidden = false;
      if (window.hideLoadingState) window.hideLoadingState();
      return;
    }

    // FRONTEND: Keep the static demonstration on this page until the backend sets a build endpoint.
    if (buildForm.getAttribute("action") === "#") {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
    }
  });
}

restoreStoredComponents();
refreshBuildStatus();

// BACKEND: Call this after filling or clearing a row's hidden product ID.
window.refreshBuildStatus = refreshBuildStatus;

// FRONTEND: Open and close the small-screen navigation menu.
const mobileMenuButton = document.querySelector("#mobile-menu-button");
const mainNavigation = document.querySelector("#main-nav");

function closeMobileMenu() {
  if (!mobileMenuButton || !mainNavigation) return;
  mainNavigation.removeAttribute("data-open");
  mobileMenuButton.setAttribute("aria-expanded", "false");
  mobileMenuButton.setAttribute("aria-label", "Open navigation menu");
}

if (mobileMenuButton && mainNavigation) {
  mobileMenuButton.addEventListener("click", () => {
    const isOpen = mainNavigation.getAttribute("data-open") === "true";
    if (isOpen) {
      closeMobileMenu();
    } else {
      mainNavigation.setAttribute("data-open", "true");
      mobileMenuButton.setAttribute("aria-expanded", "true");
      mobileMenuButton.setAttribute("aria-label", "Close navigation menu");
    }
  });

  mainNavigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMobileMenu));
  window.matchMedia("(min-width: 701px)").addEventListener("change", (event) => {
    if (event.matches) closeMobileMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMobileMenu();
  });
}

// FRONTEND JAVASCRIPT ENDS HERE.
