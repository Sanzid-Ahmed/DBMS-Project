/*
 * FRONTEND ONLY:
 * This file validates the sign-up fields before the form is sent.
 * The backend must repeat all checks, protect passwords, and reject duplicate emails.
 */

const signupForm = document.querySelector("#signup-form");
const signupFormError = document.querySelector("#signup-form-error");
const signupName = document.querySelector("#signup-name");
const signupNameError = document.querySelector("#signup-name-error");
const signupEmail = document.querySelector("#signup-email");
const signupEmailError = document.querySelector("#signup-email-error");
const signupPassword = document.querySelector("#signup-password");
const signupPasswordError = document.querySelector("#signup-password-error");
const signupConfirmPassword = document.querySelector("#signup-confirm-password");
const signupConfirmPasswordError = document.querySelector("#signup-confirm-password-error");
const signupTerms = document.querySelector("#signup-terms-accepted");
const signupTermsError = document.querySelector("#signup-terms-error");
const signupFieldErrors = {
  "signup-name": signupNameError,
  "signup-email": signupEmailError,
  "signup-password": signupPasswordError,
  "signup-confirm-password": signupConfirmPasswordError,
};

function showSignupFieldError(field, errorMessage, message) {
  field.setAttribute("aria-invalid", "true");
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearSignupFieldError(field, errorMessage) {
  field.removeAttribute("aria-invalid");
  errorMessage.hidden = true;
}

function showSignupFormError(message) {
  if (!signupFormError) return;

  signupFormError.textContent = message;
  signupFormError.hidden = false;
}

function hideSignupFormError() {
  if (signupFormError) signupFormError.hidden = true;
}

function validateSignupForm() {
  let firstInvalidField = null;

  clearSignupFieldError(signupName, signupNameError);
  clearSignupFieldError(signupEmail, signupEmailError);
  clearSignupFieldError(signupPassword, signupPasswordError);
  clearSignupFieldError(signupConfirmPassword, signupConfirmPasswordError);
  clearSignupFieldError(signupTerms, signupTermsError);
  hideSignupFormError();

  if (signupName.value.trim().length < 2) {
    showSignupFieldError(signupName, signupNameError, "Please enter at least 2 characters for your name.");
    firstInvalidField = signupName;
  }

  if (!signupEmail.value.trim()) {
    showSignupFieldError(signupEmail, signupEmailError, "Please enter your email address.");
    if (!firstInvalidField) firstInvalidField = signupEmail;
  } else if (!signupEmail.validity.valid) {
    showSignupFieldError(signupEmail, signupEmailError, "Please enter a valid email address.");
    if (!firstInvalidField) firstInvalidField = signupEmail;
  }

  if (signupPassword.value.length < 8) {
    showSignupFieldError(signupPassword, signupPasswordError, "Password must contain at least 8 characters.");
    if (!firstInvalidField) firstInvalidField = signupPassword;
  }

  if (!signupConfirmPassword.value) {
    showSignupFieldError(signupConfirmPassword, signupConfirmPasswordError, "Please confirm your password.");
    if (!firstInvalidField) firstInvalidField = signupConfirmPassword;
  } else if (signupConfirmPassword.value !== signupPassword.value) {
    showSignupFieldError(signupConfirmPassword, signupConfirmPasswordError, "The passwords must match.");
    if (!firstInvalidField) firstInvalidField = signupConfirmPassword;
  }

  if (!signupTerms.checked) {
    showSignupFieldError(signupTerms, signupTermsError, "Please accept the terms and privacy policy.");
    if (!firstInvalidField) firstInvalidField = signupTerms;
  }

  if (firstInvalidField) {
    showSignupFormError("Please correct the highlighted fields.");
    firstInvalidField.focus();
    return false;
  }

  return true;
}

if (
  signupForm && signupName && signupNameError && signupEmail && signupEmailError &&
  signupPassword && signupPasswordError && signupConfirmPassword && signupConfirmPasswordError &&
  signupTerms && signupTermsError
) {
  signupForm.addEventListener("submit", (event) => {
    if (!validateSignupForm()) {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
      return;
    }

    // FRONTEND: Keep the static demonstration on this page until the backend sets a real sign-up endpoint.
    if (signupForm.getAttribute("action") === "#") {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
    }
  });

  [signupName, signupEmail, signupPassword, signupConfirmPassword].forEach((field) => {
    field.addEventListener("input", () => {
      clearSignupFieldError(field, signupFieldErrors[field.id]);
      hideSignupFormError();
    });
  });

  signupTerms.addEventListener("change", () => {
    clearSignupFieldError(signupTerms, signupTermsError);
    hideSignupFormError();
  });
}

// BACKEND: Set a real form action. Validate every named field again and return safe field or form errors.

// FRONTEND JAVASCRIPT ENDS HERE.
