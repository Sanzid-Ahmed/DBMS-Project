/*
 * FRONTEND ONLY:
 * This file switches the profile fields between read-only and editing states.
 * The backend remains responsible for authentication, validation, and saving changes.
 */

const profileForm = document.querySelector("#profile-form");
const editProfileButton = document.querySelector("#edit-profile-button");
const profileFormActions = document.querySelector("#profile-form-actions");
const cancelProfileButton = document.querySelector("#cancel-profile-button");
const fullNameInput = document.querySelector("#full-name");
const profileDisplayName = document.querySelector("#profile-display-name");
const profileAvatar = document.querySelector("#profile-avatar");
const profileFormError = document.querySelector("#profile-form-error");
const editableProfileFields = profileForm
  ? profileForm.querySelectorAll("input:not([type='hidden'])")
  : [];
const profileFieldErrors = {
  "full-name": document.querySelector("#full-name-error"),
  "phone-number": document.querySelector("#phone-number-error"),
  address: document.querySelector("#address-error"),
  city: document.querySelector("#city-error"),
  "postal-code": document.querySelector("#postal-code-error"),
  country: document.querySelector("#country-error"),
};

let originalProfileValues = {};

function rememberProfileValues() {
  originalProfileValues = {};

  editableProfileFields.forEach((field) => {
    originalProfileValues[field.id] = field.value;
  });
}

function restoreProfileValues() {
  editableProfileFields.forEach((field) => {
    if (originalProfileValues[field.id] !== undefined) {
      field.value = originalProfileValues[field.id];
    }
  });
}

function getInitials(fullName) {
  const nameParts = fullName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) return "";
  if (nameParts.length === 1) return nameParts[0].slice(0, 2).toUpperCase();

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
}

function setProfileEditing(isEditing) {
  if (!profileForm) return;

  profileForm.dataset.editing = String(isEditing);

  editableProfileFields.forEach((field) => {
    field.readOnly = !isEditing;
  });

  if (editProfileButton) editProfileButton.hidden = isEditing;
  if (profileFormActions) profileFormActions.hidden = !isEditing;
}

function showProfileFieldError(field, message) {
  const errorMessage = profileFieldErrors[field.id];

  if (!errorMessage) return;
  field.setAttribute("aria-invalid", "true");
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearProfileFieldError(field) {
  const errorMessage = profileFieldErrors[field.id];

  field.removeAttribute("aria-invalid");
  if (errorMessage) errorMessage.hidden = true;
}

function clearProfileFormErrors() {
  editableProfileFields.forEach(clearProfileFieldError);
  if (profileFormError) profileFormError.hidden = true;
}

function validateProfileForm() {
  const phoneNumber = document.querySelector("#phone-number");
  const address = document.querySelector("#address");
  const city = document.querySelector("#city");
  const postalCode = document.querySelector("#postal-code");
  const country = document.querySelector("#country");
  let firstInvalidField = null;

  clearProfileFormErrors();

  if (fullNameInput && fullNameInput.value.trim().length < 2) {
    showProfileFieldError(fullNameInput, "Please enter at least 2 characters for your name.");
    firstInvalidField = fullNameInput;
  }

  if (phoneNumber && phoneNumber.value.replace(/\D/g, "").length < 7) {
    showProfileFieldError(phoneNumber, "Please enter a valid phone number.");
    if (!firstInvalidField) firstInvalidField = phoneNumber;
  }

  [address, city, postalCode, country].forEach((field) => {
    if (field && !field.value.trim()) {
      showProfileFieldError(field, `Please enter your ${field.labels[0].textContent.toLowerCase()}.`);
      if (!firstInvalidField) firstInvalidField = field;
    }
  });

  if (firstInvalidField) {
    if (profileFormError) profileFormError.hidden = false;
    firstInvalidField.focus();
    return false;
  }

  return true;
}

if (editProfileButton && profileForm) {
  editProfileButton.addEventListener("click", () => {
    rememberProfileValues();
    clearProfileFormErrors();
    setProfileEditing(true);

    if (fullNameInput) {
      fullNameInput.focus();
      fullNameInput.select();
    }
  });
}

if (cancelProfileButton) {
  cancelProfileButton.addEventListener("click", () => {
    restoreProfileValues();
    clearProfileFormErrors();
    setProfileEditing(false);
  });
}

editableProfileFields.forEach((field) => {
  field.addEventListener("input", () => {
    clearProfileFieldError(field);
    if (profileFormError) profileFormError.hidden = true;
  });
});

if (profileForm) {
  profileForm.addEventListener("submit", (event) => {
    if (!validateProfileForm()) {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
      return;
    }

    // FRONTEND: Keep the demonstration usable until the backend supplies a real endpoint.
    if (profileForm.getAttribute("action") === "#") {
      event.preventDefault();

      if (fullNameInput && profileDisplayName) {
        profileDisplayName.textContent = fullNameInput.value.trim();
      }

      if (fullNameInput && profileAvatar) {
        profileAvatar.textContent = getInitials(fullNameInput.value);
      }

      rememberProfileValues();
      setProfileEditing(false);

      if (window.hideLoadingState) {
        window.hideLoadingState();
      }
    }
  });
}

// BACKEND: After changing profile-form's action, its named inputs submit directly to that endpoint.

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
