/*
 * FRONTEND ONLY:
 * This file controls filters, layouts, comparison selection, visible product states,
 * and the sessionStorage connection between Component.html and BuildPc.html.
 * Database queries, cart actions, and trusted product validation remain backend work.
 */

const BUILD_STORAGE_KEY = "thriftBuildSelectedComponents";
const pageParameters = new URLSearchParams(window.location.search);
const requestedCategory = pageParameters.get("category") || "";
const selectedSlot = pageParameters.get("slot") || requestedCategory;
const isBuilderMode = pageParameters.get("from") === "builder" && Boolean(requestedCategory && selectedSlot);

const builderHeadings = {
  processor: "Choose a Processor",
  motherboard: "Choose a Motherboard",
  ram: "Choose RAM",
  "graphics-card": "Choose a Graphics Card",
  ssd: "Choose an SSD",
  "hard-disk": "Choose a Hard Disk",
  "power-supply": "Choose a Power Supply",
  "processor-cooler": "Choose a Processor Cooler",
  casing: "Choose a Casing",
  "casing-fans": "Choose Casing Fans",
};

const mobileFilterButton = document.querySelector("#mobile-filter-button");
const filtersPanel = document.querySelector("#filters-panel");
const filterForm = document.querySelector("#filter-form");
const minimumPrice = document.querySelector("#minimum-price");
const maximumPrice = document.querySelector("#maximum-price");
const priceRangeError = document.querySelector("#price-range-error");
const sortProducts = document.querySelector("#sort-products");
const productGrid = document.querySelector("#product-grid");
const viewButtons = document.querySelectorAll(".view-button");
const compareSelectedButton = document.querySelector("#compare-selected");
const compareCount = document.querySelector("#compare-count");

function getProductCards() {
  return document.querySelectorAll('#product-grid > [id^="product-"]');
}

function getCompareCheckboxes() {
  return document.querySelectorAll('[name="compare_product_ids"]');
}

function normalizeComponentType(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, "-");
}

function getProductCategory(card) {
  const categoryText = card.querySelector('[id$="-category"]');
  return normalizeComponentType(card.dataset.componentType || (categoryText ? categoryText.textContent : ""));
}

function getProductPrice(card) {
  const normalPrice = card.querySelector('[id$="-prices"] > span[id$="-price"]');
  const discountedPrice = card.querySelector('[id$="-discounted-price"]');

  if (card.dataset.discounted === "true" && discountedPrice) {
    return discountedPrice.textContent.trim();
  }

  return normalPrice ? normalPrice.textContent.trim() : "৳0";
}

function parsePrice(priceText) {
  return Number(String(priceText).replace(/[^0-9.]/g, "")) || 0;
}

function readStoredComponents() {
  try {
    return JSON.parse(sessionStorage.getItem(BUILD_STORAGE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

// FRONTEND: Validate only the price values that the user entered; empty price fields are allowed.
function validatePriceRange() {
  if (!minimumPrice || !maximumPrice || !priceRangeError) return true;

  minimumPrice.removeAttribute("aria-invalid");
  maximumPrice.removeAttribute("aria-invalid");
  priceRangeError.hidden = true;

  const minimumValue = minimumPrice.value === "" ? null : Number(minimumPrice.value);
  const maximumValue = maximumPrice.value === "" ? null : Number(maximumPrice.value);
  const hasNegativePrice =
    (minimumValue !== null && (minimumValue < 0 || Number.isNaN(minimumValue))) ||
    (maximumValue !== null && (maximumValue < 0 || Number.isNaN(maximumValue)));
  const hasInvalidRange = minimumValue !== null && maximumValue !== null && minimumValue > maximumValue;

  if (!hasNegativePrice && !hasInvalidRange) return true;

  minimumPrice.setAttribute("aria-invalid", "true");
  maximumPrice.setAttribute("aria-invalid", "true");
  priceRangeError.hidden = false;
  priceRangeError.textContent = hasNegativePrice
    ? "Prices must be zero or more."
    : "Minimum price cannot be greater than maximum price.";

  if (hasInvalidRange) {
    minimumPrice.focus();
  } else if (minimumValue !== null && minimumValue < 0) {
    minimumPrice.focus();
  } else {
    maximumPrice.focus();
  }

  return false;
}

// FRONTEND: Copy each rendered database ID to its normal catalog controls.
function refreshProductStates() {
  let visibleProducts = 0;

  getProductCards().forEach((card) => {
    const productId = card.dataset.productId || "";
    const compareCheckbox = card.querySelector('[name="compare_product_ids"]');
    const productActionButton = card.querySelector('[id$="-add-to-cart"]');

    if (isBuilderMode) {
      const matchesCategory = getProductCategory(card) === requestedCategory;
      const compareOption = card.querySelector('[id$="-actions"] label');

      card.hidden = !matchesCategory;
      if (matchesCategory) visibleProducts += 1;
      if (compareOption) compareOption.hidden = true;
      if (productActionButton) productActionButton.textContent = "Select";
    }

    if (compareCheckbox) {
      compareCheckbox.value = productId;
      compareCheckbox.disabled = isBuilderMode || !productId;
    }
    if (productActionButton) {
      productActionButton.dataset.productId = productId;
      productActionButton.dataset.action = isBuilderMode ? "select" : "add-to-cart";
      productActionButton.disabled = card.dataset.stock === "out-of-stock" || !productId;
    }
  });

  if (isBuilderMode) {
    const resultCount = document.querySelector("#result-count");
    if (resultCount) resultCount.textContent = visibleProducts;
  }

  updateCompareState();
}

function addBuilderParameters(form) {
  if (!form) return;

  const values = {
    category: requestedCategory,
    from: "builder",
    slot: selectedSlot,
  };

  Object.entries(values).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    input.dataset.builderParameter = name;
    form.append(input);
  });
}

function selectProductForBuild(card) {
  const productId = card.dataset.productId || "";
  const productName = card.querySelector('[id$="-name"]');
  const productCategory = getProductCategory(card) || requestedCategory;
  const priceText = getProductPrice(card);

  if (!productId || !productName) return;

  const storedComponents = readStoredComponents();
  storedComponents[selectedSlot] = {
    productId,
    productName: productName.textContent.trim(),
    price: parsePrice(priceText),
    priceText,
    category: productCategory,
    slot: selectedSlot,
  };

  sessionStorage.setItem(BUILD_STORAGE_KEY, JSON.stringify(storedComponents));

  if (window.showLoadingState) {
    window.showLoadingState("Adding component to your build...");
  }

  window.location.href = "BuildPc.html";
}

// FRONTEND: Lock the requested category and turn product actions into builder selection.
function setupBuilderMode() {
  if (!isBuilderMode) return;

  const pageTitle = document.querySelector("#page-title");
  const clearFilters = document.querySelector("#clear-filters");
  const categoryFilters = document.querySelectorAll('#filter-form input[name="category"]');

  document.body.dataset.pageMode = "builder";

  if (pageTitle) {
    pageTitle.textContent = builderHeadings[selectedSlot] || "Choose a Component";
  }

  categoryFilters.forEach((checkbox) => {
    checkbox.checked = checkbox.value === requestedCategory;
    checkbox.disabled = true;
  });

  if (compareSelectedButton) compareSelectedButton.hidden = true;

  if (clearFilters) {
    const clearParameters = new URLSearchParams({
      category: requestedCategory,
      from: "builder",
      slot: selectedSlot,
    });
    clearFilters.href = `Component.html?${clearParameters.toString()}`;
  }

  addBuilderParameters(document.querySelector("#header-search"));
  addBuilderParameters(document.querySelector("#catalog-search"));
  addBuilderParameters(filterForm);

  document.querySelectorAll("#pagination a").forEach((link) => {
    const pageUrl = new URL(link.getAttribute("href"), window.location.href);
    pageUrl.searchParams.set("category", requestedCategory);
    pageUrl.searchParams.set("from", "builder");
    pageUrl.searchParams.set("slot", selectedSlot);
    link.href = pageUrl.href;
  });
}

// FRONTEND: Show or hide the filter panel on tablet and mobile screens.
if (mobileFilterButton && filtersPanel) {
  mobileFilterButton.addEventListener("click", () => {
    const filtersAreOpen = filtersPanel.dataset.open === "true";

    if (filtersAreOpen) {
      filtersPanel.removeAttribute("data-open");
    } else {
      filtersPanel.dataset.open = "true";
    }

    mobileFilterButton.setAttribute("aria-expanded", String(!filtersAreOpen));
    mobileFilterButton.textContent = filtersAreOpen ? "Filters" : "Hide Filters";
  });
}

// FRONTEND: Change only the visual layout; product data remains unchanged.
viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!productGrid) return;

    productGrid.dataset.view = button.dataset.view;

    viewButtons.forEach((viewButton) => {
      const isSelected = viewButton === button;
      viewButton.classList.toggle("active", isSelected);
      viewButton.setAttribute("aria-pressed", String(isSelected));
    });
  });
});

// FRONTEND: Submit the current filters together with the new sorting choice.
if (filterForm) {
  filterForm.addEventListener("submit", (event) => {
    if (!validatePriceRange()) {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
    }
  });
}

if (minimumPrice && maximumPrice && priceRangeError) {
  [minimumPrice, maximumPrice].forEach((field) => {
    field.addEventListener("input", () => {
      field.removeAttribute("aria-invalid");
      priceRangeError.hidden = true;
    });
  });
}

if (sortProducts && filterForm) {
  sortProducts.addEventListener("change", () => filterForm.requestSubmit());
}

// FRONTEND: A normal catalog comparison becomes available after two selections.
function updateCompareState() {
  const selectedCount = Array.from(getCompareCheckboxes()).filter((checkbox) => checkbox.checked).length;

  if (compareCount) compareCount.textContent = selectedCount;
  if (compareSelectedButton) compareSelectedButton.disabled = selectedCount < 2;
}

if (productGrid) {
  productGrid.addEventListener("change", (event) => {
    if (event.target.matches('[name="compare_product_ids"]')) updateCompareState();
  });

  productGrid.addEventListener("click", (event) => {
    if (!isBuilderMode) return;

    const selectButton = event.target.closest('[id$="-add-to-cart"]');
    const productCard = selectButton ? selectButton.closest('[id^="product-"]') : null;

    if (selectButton && productCard) {
      event.preventDefault();
      selectProductForBuild(productCard);
    }
  });
}

setupBuilderMode();
refreshProductStates();

// BACKEND: Call this after rendering or asynchronously replacing product cards, IDs, prices, or stock states.
window.refreshProductStates = refreshProductStates;

// FRONTEND: Restore the desktop filter panel state when the viewport becomes wider.
if (mobileFilterButton && filtersPanel) {
  window.matchMedia("(min-width: 901px)").addEventListener("change", (event) => {
    if (event.matches) {
      filtersPanel.removeAttribute("data-open");
      mobileFilterButton.setAttribute("aria-expanded", "false");
      mobileFilterButton.textContent = "Filters";
    }
  });
}

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
