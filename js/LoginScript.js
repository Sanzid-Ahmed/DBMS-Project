/*
 * FRONTEND ONLY:
 * This file validates the login fields before the form is sent.
 * The backend must validate the credentials again and create the session securely.
 */

const loginForm = document.querySelector("#login-form");
const loginFormError = document.querySelector("#login-form-error");
const loginEmail = document.querySelector("#login-email");
const loginEmailError = document.querySelector("#login-email-error");
const loginPassword = document.querySelector("#login-password");
const loginPasswordError = document.querySelector("#login-password-error");

function showLoginFieldError(field, errorMessage, message) {
  field.setAttribute("aria-invalid", "true");
  errorMessage.textContent = message;
  errorMessage.hidden = false;
}

function clearLoginFieldError(field, errorMessage) {
  field.removeAttribute("aria-invalid");
  errorMessage.hidden = true;
}

function showLoginFormError(message) {
  if (!loginFormError) return;

  loginFormError.textContent = message;
  loginFormError.hidden = false;
}

function hideLoginFormError() {
  if (loginFormError) loginFormError.hidden = true;
}

function validateLoginForm() {
  let firstInvalidField = null;

  clearLoginFieldError(loginEmail, loginEmailError);
  clearLoginFieldError(loginPassword, loginPasswordError);
  hideLoginFormError();

  if (!loginEmail.value.trim()) {
    showLoginFieldError(loginEmail, loginEmailError, "Please enter your email address.");
    firstInvalidField = loginEmail;
  } else if (!loginEmail.validity.valid) {
    showLoginFieldError(loginEmail, loginEmailError, "Please enter a valid email address.");
    firstInvalidField = loginEmail;
  }

  if (!loginPassword.value) {
    showLoginFieldError(loginPassword, loginPasswordError, "Please enter your password.");
    if (!firstInvalidField) firstInvalidField = loginPassword;
  }

  if (firstInvalidField) {
    showLoginFormError("Please correct the highlighted fields.");
    firstInvalidField.focus();
    return false;
  }

  return true;
}

if (loginForm && loginEmail && loginEmailError && loginPassword && loginPasswordError) {
  loginForm.addEventListener("submit", (event) => {
    if (!validateLoginForm()) {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
      return;
    }

    // FRONTEND: Keep the static demonstration on this page until the backend sets a real login endpoint.
    if (loginForm.getAttribute("action") === "#") {
      event.preventDefault();
      if (window.hideLoadingState) window.hideLoadingState();
    }
  });

  [loginEmail, loginPassword].forEach((field) => {
    field.addEventListener("input", () => {
      const errorMessage = field === loginEmail ? loginEmailError : loginPasswordError;
      clearLoginFieldError(field, errorMessage);
      hideLoginFormError();
    });
  });
}

// BACKEND: Set a real form action. On a rejected login, render login-form-error without exposing account details.

// FRONTEND JAVASCRIPT ENDS HERE.
