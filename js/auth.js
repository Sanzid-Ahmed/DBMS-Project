const AUTH_KEY = "pcbuilder_auth_token";
const USER_KEY = "pcbuilder_user_email";
const THEME_KEY = "pcbuilder_theme";

const $ = id => document.getElementById(id);

const loginTab = $("tab-login");
const signupTab = $("tab-signup");
const loginBox = $("login-form-container");
const signupBox = $("signup-form-container");
const sessionBox = $("user-session-container");
const loginForm = $("login-form");
const signupForm = $("signup-form");
const message = $("auth-message");

// ==================== INIT ====================

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initTabs();
    initPasswordToggle();
    initForms();

    if (localStorage.getItem(AUTH_KEY)) {
        showSession();
    } else {
        showTab("login");
    }
});

// ==================== THEME ====================

function initTheme() {
    const theme = localStorage.getItem(THEME_KEY) || "dark";
    applyTheme(theme);

    $("theme-toggle").onclick = () => {
        const current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "dark" ? "light" : "dark");
    };
}

function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);

    $("theme-icon").textContent = theme === "dark" ? "🌙" : "☀️";
    $("theme-text").textContent =
        theme === "dark" ? "Dark Mode" : "Light Mode";
}

// ==================== TABS ====================

function initTabs() {
    loginTab.onclick = () => showTab("login");
    signupTab.onclick = () => showTab("signup");

    $("switch-to-signup").onclick = e => {
        e.preventDefault();
        showTab("signup");
    };

    $("switch-to-login").onclick = e => {
        e.preventDefault();
        showTab("login");
    };
}

function showTab(tab) {
    clearMessage();

    const login = tab === "login";

    loginTab.classList.toggle("active", login);
    signupTab.classList.toggle("active", !login);

    loginBox.classList.toggle("hidden", !login);
    signupBox.classList.toggle("hidden", login);
    sessionBox.classList.add("hidden");
}

function showSession() {
    loginBox.classList.add("hidden");
    signupBox.classList.add("hidden");
    sessionBox.classList.remove("hidden");

    $("logged-user-email").textContent =
        localStorage.getItem(USER_KEY) || "Builder";
}

// ==================== PASSWORD TOGGLE ====================

function initPasswordToggle() {
    document.querySelectorAll(".toggle-password-btn").forEach(btn => {
        btn.onclick = () => {
            const input = btn.previousElementSibling;
            const hidden = input.type === "password";

            input.type = hidden ? "text" : "password";
            btn.textContent = hidden ? "Hide" : "Show";
        };
    });
}

// ==================== FORMS ====================

function initForms() {

    $("signup-password").oninput = e => {
        passwordStrength(e.target.value);
    };

    loginForm.onsubmit = async e => {
        e.preventDefault();

        const email = $("login-email").value.trim();
        const password = $("login-password").value;

        if (!validateEmail(email)) {
            return fieldError(
                "login-email-error",
                "Please enter a valid email."
            );
        }

        if (!password) {
            return fieldError(
                "login-password-error",
                "Password is required."
            );
        }

        await loginUser(email, password);
    };

    signupForm.onsubmit = async e => {
        e.preventDefault();

        const username = $("signup-username").value.trim();
        const email = $("signup-email").value.trim();
        const password = $("signup-password").value;
        const confirm = $("signup-confirm-password").value;
        const url = $("signup-url").value.trim();

        let valid = true;

        if (username.length < 3) {
            fieldError(
                "signup-username-error",
                "Username must be at least 3 characters."
            );
            valid = false;
        }

        if (!validateEmail(email)) {
            fieldError(
                "signup-email-error",
                "Please enter a valid email."
            );
            valid = false;
        }

        if (!validatePassword(password)) {
            fieldError(
                "signup-password-error",
                "Min 8 chars, uppercase, lowercase and number."
            );
            valid = false;
        }

        if (password !== confirm) {
            fieldError(
                "signup-confirm-password-error",
                "Passwords do not match."
            );
            valid = false;
        }

        if (url && !validateURL(url)) {
            fieldError(
                "signup-url-error",
                "Please enter a valid URL."
            );
            valid = false;
        }

        if (!valid) return;

        await registerUser(email, password);
    };

    $("logout-btn").onclick = logout;
}

// ==================== REGISTER ====================

async function registerUser(email, password) {
    try {
        const params = new URLSearchParams({ email, password });

        const response = await fetch(
            "http://localhost:8090/signup",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: params
            }
        );

        const data = await response.text();

        if (!response.ok) throw new Error(data);

        showMessage("✓ " + data, "success");
        signupForm.reset();
        passwordStrength("");

        setTimeout(() => showTab("login"), 1500);

    } catch (error) {
        console.error("Registration error:", error);
        showMessage("✕ " + error.message, "error");
    }
}

// ==================== LOGIN ====================

async function loginUser(email, password) {
    try {
        const params = new URLSearchParams({ email, password });

        const response = await fetch(
            "http://localhost:8090/login",
            {
                method: "POST",
                headers: {
                    "Content-Type":
                        "application/x-www-form-urlencoded"
                },
                body: params
            }
        );

        const data = await response.text();

        if (!response.ok) throw new Error(data);

        if (data === "Login Successfully") {

            localStorage.setItem(AUTH_KEY, "logged_in");
            localStorage.setItem(USER_KEY, email);

            showMessage(
                "✓ Logged in successfully!",
                "success"
            );

            loginForm.reset();

            // Go to home page
            setTimeout(() => {
                window.location.href = "../index.html";
            }, 800);

        } else {
            showMessage("✕ " + data, "error");
        }

    } catch (error) {
        console.error("Login error:", error);
        showMessage("✕ " + error.message, "error");
    }
}

// ==================== LOGOUT ====================

function logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);

    showTab("login");
    showMessage("✓ You have been logged out.", "success");
}

// ==================== VALIDATION ====================

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateURL(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

function validatePassword(password) {
    return (
        password.length >= 8 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
    );
}

// ==================== PASSWORD STRENGTH ====================

function passwordStrength(password) {
    const bar = $("strength-bar");
    const text = $("strength-text");

    let score = 0;

    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    if (!password) {
        bar.style.width = "0%";
        text.textContent = "Password strength: None";
        return;
    }

    if (score <= 2) {
        bar.style.width = "33%";
        bar.style.backgroundColor = "var(--error-color)";
        text.textContent = "Password strength: Weak";
    } else if (score <= 4) {
        bar.style.width = "66%";
        bar.style.backgroundColor = "#f59e0b";
        text.textContent = "Password strength: Medium";
    } else {
        bar.style.width = "100%";
        bar.style.backgroundColor = "var(--success-color)";
        text.textContent = "Password strength: Strong";
    }
}

// ==================== MESSAGES ====================

function showMessage(text, type) {
    message.textContent = text;
    message.className = `auth-message ${type}`;
}

function clearMessage() {
    message.textContent = "";
    message.className = "auth-message hidden";
}

function fieldError(id, text) {
    $(id).textContent = text;
}