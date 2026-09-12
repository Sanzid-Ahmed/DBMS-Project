/*
 * FRONTEND ONLY:
 * This file controls Home page interface behavior in the browser.
 * It does not load database data, authenticate users, or process backend requests.
 */

// FRONTEND: Hero banner slider elements and automatic slide timing.
const slides = document.querySelectorAll(".slide");
const previousButton = document.querySelector("#previous");
const nextButton = document.querySelector("#next");
const sliderDotsContainer = document.querySelector("#slider-dots");
let sliderDots = [];
let currentSlide = 0;
let slideTimer;

// FRONTEND: Generate the controls from the rendered images so both counts always match.
function createSliderDots() {
  if (!sliderDotsContainer) {
    return;
  }

  sliderDotsContainer.replaceChildren();

  slides.forEach((slide, index) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show slide ${index + 1}`);
    dot.addEventListener("click", () => {
      showSlide(index);
      startSlider();
    });
    sliderDotsContainer.append(dot);
  });

  sliderDots = Array.from(sliderDotsContainer.querySelectorAll(".slider-dot"));
}

function showSlide(index) {
  if (slides.length === 0) {
    return;
  }

  const activeSlide = slides[currentSlide];
  if (activeSlide) {
    activeSlide.classList.remove("active");
  }

  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");

  sliderDots.forEach((dot, dotIndex) => {
    const isCurrentSlide = dotIndex === currentSlide;
    dot.classList.toggle("active", isCurrentSlide);

    if (isCurrentSlide) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
  });
}

// FRONTEND: Restart the timer after a visitor changes slides manually.
function startSlider() {
  clearInterval(slideTimer);
  if (slides.length > 1) {
    slideTimer = setInterval(() => showSlide(currentSlide + 1), 5000);
  }
}

if (previousButton) {
  previousButton.addEventListener("click", () => {
    showSlide(currentSlide - 1);
    startSlider();
  });
}

if (nextButton) {
  nextButton.addEventListener("click", () => {
    showSlide(currentSlide + 1);
    startSlider();
  });
}

if (slides.length > 0) {
  createSliderDots();
  showSlide(0);
  startSlider();
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
