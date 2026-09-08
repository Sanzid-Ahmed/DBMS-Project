// ============================================================
// GLOBAL STATE
// ============================================================

let allComponents = [];
let filteredComponents = [];

let selectedCategory = "All";
let selectedBrands = new Set();

let searchQuery = "";

let minPrice = null;
let maxPrice = null;

let inStockOnly = false;
let minRating = 0;

let currentSort = "recommended";


// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initEventListeners();
  loadComponents();
});


// ============================================================
// LOAD COMPONENT DATA
// ============================================================

/**
 * Loads component data from JSON.
 *
 * Later, you can replace the GitHub JSON URL with:
 *
 * const response = await fetch(
 *   "http://localhost:8080/api/components"
 * );
 *
 * const components = await response.json();
 */
async function loadComponents() {
  const loadingState = document.getElementById("loadingState");
  const productGrid = document.getElementById("productGrid");
  const emptyState = document.getElementById("emptyState");

  if (loadingState) {
    loadingState.classList.remove("hidden");
  }

  if (productGrid) {
    productGrid.innerHTML = "";
  }

  if (emptyState) {
    emptyState.classList.add("hidden");
  }

  try {
    // Load component data from JSON file
    const response = await fetch(
      "https://sanzid-ahmed.github.io/DBMS_API/components.json"
    );

    console.log("API Response:", response);

    if (!response.ok) {
      throw new Error("Failed to load component data");
    }

    const components = await response.json();

    console.log("Loaded Components:", components);

    // Make sure response is an array
    if (!Array.isArray(components)) {
      throw new Error("Component data must be an array");
    }

    // Calculate price information
    allComponents = components.map((item) => calculatePriceData(item));

    console.log("Processed Components:", allComponents);

    if (loadingState) {
      loadingState.classList.add("hidden");
    }

    // Render category navigation
    renderCategoryNav();

    // Apply filters and render products
    applyFilters();

  } catch (error) {
    console.error("Error loading components:", error);

    if (loadingState) {
      loadingState.classList.add("hidden");
    }

    if (productGrid) {
      productGrid.innerHTML = `
        <p class="error-message">
          Failed to load component data.
        </p>
      `;
    }
  }
}


// ============================================================
// PRICE CALCULATIONS
// ============================================================

function calculatePriceData(item) {
  const stores = Array.isArray(item.stores) ? item.stores : [];

  // No store information
  if (stores.length === 0) {
    return {
      ...item,
      calculatedLowestPrice: 0,
      calculatedHighestPrice: 0,
      cheapestStore: "N/A",
      savings: 0,
      totalStores: 0
    };
  }

  let lowestPrice = Infinity;
  let highestPrice = -Infinity;
  let cheapestStore = "N/A";

  stores.forEach((store) => {
    const price = Number(store.price);

    // Ignore invalid prices
    if (isNaN(price)) {
      return;
    }

    if (price < lowestPrice) {
      lowestPrice = price;
      cheapestStore = store.name || "Unknown Store";
    }

    if (price > highestPrice) {
      highestPrice = price;
    }
  });

  // If no valid prices were found
  if (lowestPrice === Infinity) {
    return {
      ...item,
      calculatedLowestPrice: 0,
      calculatedHighestPrice: 0,
      cheapestStore: "N/A",
      savings: 0,
      totalStores: stores.length
    };
  }

  const priceDiff = highestPrice - lowestPrice;

  return {
    ...item,

    calculatedLowestPrice: lowestPrice,
    calculatedHighestPrice: highestPrice,

    cheapestStore: cheapestStore,

    savings: priceDiff,

    totalStores: stores.length
  };
}


// ============================================================
// FILTER LOGIC
// ============================================================

function applyFilters() {
  filteredComponents = allComponents.filter((item) => {

    // --------------------------------------------------------
    // 1. CATEGORY FILTER
    // --------------------------------------------------------

    if (
      selectedCategory !== "All" &&
      item.type !== selectedCategory
    ) {
      return false;
    }


    // --------------------------------------------------------
    // 2. BRAND FILTER
    // --------------------------------------------------------

    if (
      selectedBrands.size > 0 &&
      !selectedBrands.has(item.brand)
    ) {
      return false;
    }


    // --------------------------------------------------------
    // 3. SEARCH FILTER
    // --------------------------------------------------------

    if (searchQuery.trim() !== "") {
      const query = searchQuery.trim().toLowerCase();

      const name = String(item.name || "").toLowerCase();
      const brand = String(item.brand || "").toLowerCase();
      const type = String(item.type || "").toLowerCase();

      const specifications = Array.isArray(item.specifications)
        ? item.specifications
        : [];

      const matchName = name.includes(query);

      const matchBrand = brand.includes(query);

      const matchType = type.includes(query);

      const matchSpecs = specifications.some((spec) =>
        String(spec).toLowerCase().includes(query)
      );

      if (
        !matchName &&
        !matchBrand &&
        !matchType &&
        !matchSpecs
      ) {
        return false;
      }
    }


    // --------------------------------------------------------
    // 4. MINIMUM PRICE FILTER
    // --------------------------------------------------------

    if (
      minPrice !== null &&
      !isNaN(minPrice) &&
      item.calculatedLowestPrice < minPrice
    ) {
      return false;
    }


    // --------------------------------------------------------
    // 5. MAXIMUM PRICE FILTER
    // --------------------------------------------------------

    if (
      maxPrice !== null &&
      !isNaN(maxPrice) &&
      item.calculatedLowestPrice > maxPrice
    ) {
      return false;
    }


    // --------------------------------------------------------
    // 6. STOCK FILTER
    // --------------------------------------------------------

    if (inStockOnly && !item.stock) {
      return false;
    }


    // --------------------------------------------------------
    // 7. RATING FILTER
    // --------------------------------------------------------

    if (
      minRating > 0 &&
      Number(item.rating || 0) < minRating
    ) {
      return false;
    }


    // Component passed all filters
    return true;
  });


  // ----------------------------------------------------------
  // UPDATE BRAND FILTERS
  // ----------------------------------------------------------

  renderBrandFilters();


  // ----------------------------------------------------------
  // SORT COMPONENTS
  // ----------------------------------------------------------

  sortComponents();


  // ----------------------------------------------------------
  // RENDER PRODUCTS
  // ----------------------------------------------------------

  renderProducts();


  // ----------------------------------------------------------
  // UPDATE PRODUCT COUNT
  // ----------------------------------------------------------

  updateProductCount();
}


// ============================================================
// DYNAMIC BRAND FILTER RENDER
// ============================================================

function renderBrandFilters() {
  const brandContainer =
    document.getElementById("brandFilterList");

  if (!brandContainer) {
    return;
  }


  // ----------------------------------------------------------
  // Find components matching current category
  // ----------------------------------------------------------

  const categoryMatchedComponents = allComponents.filter(
    (item) =>
      selectedCategory === "All" ||
      item.type === selectedCategory
  );


  // ----------------------------------------------------------
  // Count products per brand
  // ----------------------------------------------------------

  const brandCounts = {};

  categoryMatchedComponents.forEach((item) => {
    const brand = item.brand || "Unknown";

    brandCounts[brand] =
      (brandCounts[brand] || 0) + 1;
  });


  // ----------------------------------------------------------
  // Get available brands
  // ----------------------------------------------------------

  const availableBrands =
    Object.keys(brandCounts).sort();


  // ----------------------------------------------------------
  // Remove brands that don't exist in current category
  // ----------------------------------------------------------

  selectedBrands.forEach((brand) => {
    if (!brandCounts[brand]) {
      selectedBrands.delete(brand);
    }
  });


  // Clear existing brand list
  brandContainer.innerHTML = "";


  // ----------------------------------------------------------
  // No brands available
  // ----------------------------------------------------------

  if (availableBrands.length === 0) {
    brandContainer.innerHTML = `
      <span style="
        font-size: 0.8rem;
        color: var(--text-muted);
      ">
        No brands available
      </span>
    `;

    return;
  }


  // ----------------------------------------------------------
  // Render brand checkboxes
  // ----------------------------------------------------------

  availableBrands.forEach((brand) => {
    const isChecked =
      selectedBrands.has(brand);

    const label =
      document.createElement("label");

    label.className = "checkbox-item";

    label.innerHTML = `
      <input
        type="checkbox"
        value="${escapeHTML(brand)}"
        ${isChecked ? "checked" : ""}
      >

      <span>
        ${escapeHTML(brand)}
        (${brandCounts[brand]})
      </span>
    `;


    // Checkbox event
    const checkbox =
      label.querySelector("input");

    checkbox.addEventListener("change", (event) => {

      if (event.target.checked) {
        selectedBrands.add(brand);
      } else {
        selectedBrands.delete(brand);
      }

      applyFilters();
    });


    brandContainer.appendChild(label);
  });
}


// ============================================================
// SORTING LOGIC
// ============================================================

function sortComponents() {

  switch (currentSort) {

    // --------------------------------------------------------
    // PRICE: LOW TO HIGH
    // --------------------------------------------------------

    case "price-asc":

      filteredComponents.sort(
        (a, b) =>
          a.calculatedLowestPrice -
          b.calculatedLowestPrice
      );

      break;


    // --------------------------------------------------------
    // PRICE: HIGH TO LOW
    // --------------------------------------------------------

    case "price-desc":

      filteredComponents.sort(
        (a, b) =>
          b.calculatedLowestPrice -
          a.calculatedLowestPrice
      );

      break;


    // --------------------------------------------------------
    // NAME: A-Z
    // --------------------------------------------------------

    case "name-asc":

      filteredComponents.sort(
        (a, b) =>
          String(a.name || "").localeCompare(
            String(b.name || "")
          )
      );

      break;


    // --------------------------------------------------------
    // NAME: Z-A
    // --------------------------------------------------------

    case "name-desc":

      filteredComponents.sort(
        (a, b) =>
          String(b.name || "").localeCompare(
            String(a.name || "")
          )
      );

      break;


    // --------------------------------------------------------
    // RATING: HIGH TO LOW
    // --------------------------------------------------------

    case "rating-desc":

      filteredComponents.sort(
        (a, b) =>
          Number(b.rating || 0) -
          Number(a.rating || 0)
      );

      break;


    // --------------------------------------------------------
    // RECOMMENDED / DEFAULT
    // --------------------------------------------------------

    default:

      filteredComponents.sort(
        (a, b) =>
          Number(a.id || 0) -
          Number(b.id || 0)
      );

      break;
  }
}


// ============================================================
// CATEGORY NAVIGATION
// ============================================================

function renderCategoryNav() {

  const categoryNav =
    document.getElementById("categoryNav");

  if (!categoryNav) {
    return;
  }


  // ----------------------------------------------------------
  // Available component categories
  // ----------------------------------------------------------

  const categories = [
    "All",
    "CPU",
    "GPU",
    "Motherboard",
    "RAM",
    "Storage",
    "PSU",
    "PC Case",
    "CPU Cooler"
  ];


  // ----------------------------------------------------------
  // Calculate category counts
  // ----------------------------------------------------------

  const categoryCounts = {
    All: allComponents.length
  };


  allComponents.forEach((item) => {

    if (!item.type) {
      return;
    }

    categoryCounts[item.type] =
      (categoryCounts[item.type] || 0) + 1;
  });


  // Clear existing navigation
  categoryNav.innerHTML = "";


  // ----------------------------------------------------------
  // Create category buttons
  // ----------------------------------------------------------

  categories.forEach((category) => {

    const count =
      categoryCounts[category] || 0;

    const pill =
      document.createElement("button");

    pill.className =
      `cat-pill ${
        selectedCategory === category
          ? "active"
          : ""
      }`;


    pill.innerHTML = `
      ${
        category === "All"
          ? "All Components"
          : escapeHTML(category)
      }

      <span class="cat-badge">
        ${count}
      </span>
    `;


    // --------------------------------------------------------
    // Category click
    // --------------------------------------------------------

    pill.addEventListener("click", () => {

      selectedCategory = category;


      // Remove active class from all pills
      document
        .querySelectorAll(".cat-pill")
        .forEach((button) => {
          button.classList.remove("active");
        });


      // Activate clicked pill
      pill.classList.add("active");


      // Apply filters
      applyFilters();
    });


    categoryNav.appendChild(pill);
  });
}


// ============================================================
// RENDER PRODUCTS GRID
// ============================================================

function renderProducts() {

  const productGrid =
    document.getElementById("productGrid");

  const emptyState =
    document.getElementById("emptyState");


  if (!productGrid) {
    return;
  }


  // Clear current products
  productGrid.innerHTML = "";


  // ----------------------------------------------------------
  // Empty result
  // ----------------------------------------------------------

  if (filteredComponents.length === 0) {

    if (emptyState) {
      emptyState.classList.remove("hidden");
    }

    return;
  }


  if (emptyState) {
    emptyState.classList.add("hidden");
  }


  // ----------------------------------------------------------
  // Render every component
  // ----------------------------------------------------------

  filteredComponents.forEach((item) => {

    const card =
      document.createElement("div");

    card.className = "product-card";


    // --------------------------------------------------------
    // Specifications
    // --------------------------------------------------------

    const specifications =
      Array.isArray(item.specifications)
        ? item.specifications
        : [];


    const specsHTML =
      specifications
        .map(
          (spec) => `
            <span class="spec-tag">
              ${escapeHTML(spec)}
            </span>
          `
        )
        .join("");


    // --------------------------------------------------------
    // Savings
    // --------------------------------------------------------

    const savingsHTML =
      item.savings > 0
        ? `
          <span class="savings-badge">
            Save ৳${Number(
              item.savings
            ).toLocaleString()}
          </span>
        `
        : "";


    // --------------------------------------------------------
    // Price
    // --------------------------------------------------------

    const lowestPrice =
      Number(
        item.calculatedLowestPrice || 0
      );


    // --------------------------------------------------------
    // Rating
    // --------------------------------------------------------

    const rating =
      Number(item.rating || 0);


    const reviews =
      Number(item.reviews || 0);


    // --------------------------------------------------------
    // Product card
    // --------------------------------------------------------

    card.innerHTML = `
      <div class="card-image-wrapper">

        <span class="badge-category">
          ${escapeHTML(item.type || "Component")}
        </span>

        <span
          class="badge-stock ${
            item.stock
              ? "in-stock"
              : "out-of-stock"
          }"
        >
          ${
            item.stock
              ? "In Stock"
              : "Out of Stock"
          }
        </span>

        <img
          src="${escapeAttribute(
            item.image || ""
          )}"
          alt="${escapeAttribute(
            item.name || "Component"
          )}"
          loading="lazy"
          onerror="this.src='https://placehold.co/300x300/151c28/38bdf8?text=No+Image'"
        >

      </div>


      <div class="card-body">

        <div class="card-brand">
          ${escapeHTML(
            item.brand || "Unknown Brand"
          )}
        </div>


        <h3
          class="card-title"
          title="${escapeAttribute(
            item.name || ""
          )}"
        >
          ${escapeHTML(
            item.name || "Unnamed Component"
          )}
        </h3>


        <div class="card-rating">

          <span class="stars">
            ★ ${rating.toFixed(1)}
          </span>

          <span class="rating-count">
            (${reviews})
          </span>

        </div>


        <div class="card-specs">
          ${specsHTML}
        </div>


        <div class="card-price-box">

          <div class="price-label">
            Starting from
          </div>


          <div class="price-main-row">

            <span class="lowest-price">
              ৳${lowestPrice.toLocaleString()}
            </span>

            ${savingsHTML}

          </div>


          <div class="store-info">

            Lowest at
            <strong>
              ${escapeHTML(
                item.cheapestStore || "N/A"
              )}
            </strong>

            (${item.totalStores || 0} stores)

          </div>

        </div>


        <div class="card-actions">

          <button
            class="btn btn-secondary btn-sm compare-btn"
            data-id="${item.id}"
          >
            Compare
          </button>


          <button
            class="btn btn-primary btn-sm details-btn"
            data-id="${item.id}"
          >
            View Details
          </button>

        </div>

      </div>
    `;


    // --------------------------------------------------------
    // Compare button
    // --------------------------------------------------------

    const compareButton =
      card.querySelector(".compare-btn");

    compareButton.addEventListener(
      "click",
      () => {
        alert(
          `Added "${item.name}" to comparison list`
        );
      }
    );


    // --------------------------------------------------------
    // Details button
    // --------------------------------------------------------

    const detailsButton =
      card.querySelector(".details-btn");

    detailsButton.addEventListener(
      "click",
      () => {
        alert(
          `Viewing details for "${item.name}"`
        );
      }
    );


    // Add card to grid
    productGrid.appendChild(card);
  });
}


// ============================================================
// UPDATE PRODUCT COUNTER
// ============================================================

function updateProductCount() {

  const countElement =
    document.getElementById("productCount");

  if (!countElement) {
    return;
  }


  countElement.textContent =
    `Showing ${
      filteredComponents.length
    } of ${
      allComponents.length
    } components`;
}


// ============================================================
// RESET FILTERS
// ============================================================

function resetFilters() {

  // ----------------------------------------------------------
  // Reset JavaScript state
  // ----------------------------------------------------------

  selectedCategory = "All";

  selectedBrands.clear();

  searchQuery = "";

  minPrice = null;

  maxPrice = null;

  inStockOnly = false;

  minRating = 0;

  currentSort = "recommended";


  // ----------------------------------------------------------
  // Reset search
  // ----------------------------------------------------------

  const searchInput =
    document.getElementById("searchInput");

  if (searchInput) {
    searchInput.value = "";
  }


  // ----------------------------------------------------------
  // Reset minimum price
  // ----------------------------------------------------------

  const minPriceInput =
    document.getElementById("minPriceInput");

  if (minPriceInput) {
    minPriceInput.value = "";
  }


  // ----------------------------------------------------------
  // Reset maximum price
  // ----------------------------------------------------------

  const maxPriceInput =
    document.getElementById("maxPriceInput");

  if (maxPriceInput) {
    maxPriceInput.value = "";
  }


  // ----------------------------------------------------------
  // Reset price slider
  // ----------------------------------------------------------

  const priceRangeSlider =
    document.getElementById(
      "priceRangeSlider"
    );

  if (priceRangeSlider) {

    priceRangeSlider.value = 500000;
  }


  // ----------------------------------------------------------
  // Reset price range text
  // ----------------------------------------------------------

  const priceRangeValue =
    document.getElementById(
      "priceRangeValue"
    );

  if (priceRangeValue) {

    priceRangeValue.textContent =
      "৳500,000";
  }


  // ----------------------------------------------------------
  // Reset stock filter
  // ----------------------------------------------------------

  const stockCheckbox =
    document.getElementById(
      "inStockOnly"
    );

  if (stockCheckbox) {

    stockCheckbox.checked = false;
  }


  // ----------------------------------------------------------
  // Reset rating
  // ----------------------------------------------------------

  const ratingFilter =
    document.getElementById(
      "ratingFilter"
    );

  if (ratingFilter) {

    ratingFilter.value = "0";
  }


  // ----------------------------------------------------------
  // Reset sorting
  // ----------------------------------------------------------

  const sortSelect =
    document.getElementById(
      "sortSelect"
    );

  if (sortSelect) {

    sortSelect.value =
      "recommended";
  }


  // ----------------------------------------------------------
  // Re-render
  // ----------------------------------------------------------

  renderCategoryNav();

  applyFilters();
}


// ============================================================
// EVENT LISTENERS
// ============================================================

function initEventListeners() {

  // ==========================================================
  // SEARCH
  // ==========================================================

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  const clearSearchBtn =
    document.getElementById(
      "clearSearchBtn"
    );


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      (event) => {

        searchQuery =
          event.target.value;

        applyFilters();
      }
    );
  }


  if (clearSearchBtn) {

    clearSearchBtn.addEventListener(
      "click",
      () => {

        if (searchInput) {
          searchInput.value = "";
        }

        searchQuery = "";

        applyFilters();
      }
    );
  }


  // ==========================================================
  // PRICE INPUTS
  // ==========================================================

  const minPriceInput =
    document.getElementById(
      "minPriceInput"
    );

  const maxPriceInput =
    document.getElementById(
      "maxPriceInput"
    );

  const priceRangeSlider =
    document.getElementById(
      "priceRangeSlider"
    );

  const priceRangeValue =
    document.getElementById(
      "priceRangeValue"
    );


  // ----------------------------------------------------------
  // Minimum price
  // ----------------------------------------------------------

  if (minPriceInput) {

    minPriceInput.addEventListener(
      "input",
      (event) => {

        const value =
          event.target.value.trim();

        minPrice =
          value === ""
            ? null
            : parseFloat(value);

        applyFilters();
      }
    );
  }


  // ----------------------------------------------------------
  // Maximum price
  // ----------------------------------------------------------

  if (maxPriceInput) {

    maxPriceInput.addEventListener(
      "input",
      (event) => {

        const value =
          event.target.value.trim();

        maxPrice =
          value === ""
            ? null
            : parseFloat(value);

        applyFilters();
      }
    );
  }


  // ----------------------------------------------------------
  // Price slider
  // ----------------------------------------------------------

  if (priceRangeSlider) {

    priceRangeSlider.addEventListener(
      "input",
      (event) => {

        const value =
          parseFloat(
            event.target.value
          );


        maxPrice = value;


        if (maxPriceInput) {

          maxPriceInput.value =
            value;
        }


        if (priceRangeValue) {

          priceRangeValue.textContent =
            `৳${value.toLocaleString()}`;
        }


        applyFilters();
      }
    );
  }


  // ==========================================================
  // STOCK FILTER
  // ==========================================================

  const stockCheckbox =
    document.getElementById(
      "inStockOnly"
    );


  if (stockCheckbox) {

    stockCheckbox.addEventListener(
      "change",
      (event) => {

        inStockOnly =
          event.target.checked;

        applyFilters();
      }
    );
  }


  // ==========================================================
  // RATING FILTER
  // ==========================================================

  const ratingFilter =
    document.getElementById(
      "ratingFilter"
    );


  if (ratingFilter) {

    ratingFilter.addEventListener(
      "change",
      (event) => {

        minRating =
          parseFloat(
            event.target.value
          ) || 0;

        applyFilters();
      }
    );
  }


  // ==========================================================
  // SORTING
  // ==========================================================

  const sortSelect =
    document.getElementById(
      "sortSelect"
    );


  if (sortSelect) {

    sortSelect.addEventListener(
      "change",
      (event) => {

        currentSort =
          event.target.value;

        sortComponents();

        renderProducts();
      }
    );
  }


  // ==========================================================
  // RESET BUTTONS
  // ==========================================================

  const resetFiltersBtn =
    document.getElementById(
      "resetFiltersBtn"
    );

  const emptyResetBtn =
    document.getElementById(
      "emptyResetBtn"
    );


  if (resetFiltersBtn) {

    resetFiltersBtn.addEventListener(
      "click",
      resetFilters
    );
  }


  if (emptyResetBtn) {

    emptyResetBtn.addEventListener(
      "click",
      resetFilters
    );
  }


  // ==========================================================
  // MOBILE FILTER SIDEBAR
  // ==========================================================

  const mobileFilterBtn =
    document.getElementById(
      "mobileFilterBtn"
    );

  const closeSidebarBtn =
    document.getElementById(
      "closeSidebarBtn"
    );

  const filterSidebar =
    document.getElementById(
      "filterSidebar"
    );


  if (
    mobileFilterBtn &&
    filterSidebar
  ) {

    mobileFilterBtn.addEventListener(
      "click",
      () => {

        filterSidebar.classList.add(
          "open"
        );
      }
    );
  }


  if (
    closeSidebarBtn &&
    filterSidebar
  ) {

    closeSidebarBtn.addEventListener(
      "click",
      () => {

        filterSidebar.classList.remove(
          "open"
        );
      }
    );
  }


  // ==========================================================
  // MOBILE NAVIGATION
  // ==========================================================

  const hamburger =
    document.getElementById(
      "hamburger"
    );

  const navLinks =
    document.getElementById(
      "navLinks"
    );


  if (
    hamburger &&
    navLinks
  ) {

    hamburger.addEventListener(
      "click",
      () => {

        navLinks.classList.toggle(
          "active"
        );
      }
    );
  }
}


// ============================================================
// THEME SYSTEM
// ============================================================

function initTheme() {

  const themeToggleBtn =
    document.getElementById(
      "themeToggle"
    );

  const body =
    document.body;


  if (!themeToggleBtn) {
    return;
  }


  // ----------------------------------------------------------
  // Get saved theme
  // ----------------------------------------------------------

  const savedTheme =
    localStorage.getItem(
      "theme"
    );


  // ----------------------------------------------------------
  // Apply saved theme
  // ----------------------------------------------------------

  if (savedTheme === "light") {

    body.classList.add(
      "light-theme"
    );

  } else {

    body.classList.remove(
      "light-theme"
    );
  }


  // ----------------------------------------------------------
  // Theme toggle
  // ----------------------------------------------------------

  themeToggleBtn.addEventListener(
    "click",
    () => {

      body.classList.toggle(
        "light-theme"
      );


      if (
        body.classList.contains(
          "light-theme"
        )
      ) {

        localStorage.setItem(
          "theme",
          "light"
        );

      } else {

        localStorage.setItem(
          "theme",
          "dark"
        );
      }
    }
  );
}


// ============================================================
// SECURITY / HTML HELPERS
// ============================================================

/**
 * Prevent HTML injection when inserting
 * JSON values into innerHTML.
 */
function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/**
 * Escape values used inside HTML attributes.
 */
function escapeAttribute(value) {

  return escapeHTML(value);
}