// auth.js - Authentication ONLY

import { notify } from "./app.js";
import { restApi } from "./variables.js";

const KEY_LOGGED = "sr:loggedUser";

// Get logged user from localStorage
export const getLoggedUser = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_LOGGED) || "null");
  } catch (err) {
    console.error("Error parsing logged user:", err);
    return null;
  }
};

// Save logged user to localStorage
export const saveLoggedUser = (user) => {
  if (!user) {
    localStorage.removeItem(KEY_LOGGED);
    return;
  }

  // Ensure favorites array exists
  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }

  localStorage.setItem(KEY_LOGGED, JSON.stringify(user));
};

// Login user via API
export const loginUser = async (username, password) => {
  try {
    const response = await fetch(`${restApi}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      notify(errorData.message || "Invalid login");
      return false;
    }

    const data = await response.json();
    console.log("Login response:", data); // Debug

    // Handle different possible API response structures
    let userData;
    if (data.data) {
      // Structure: { message: "...", data: {...}, token: "..." }
      userData = { ...data.data, token: data.token };
    } else if (data.user) {
      // Structure: { user: {...}, token: "..." }
      userData = { ...data.user, token: data.token };
    } else {
      // Response is user object itself
      userData = data;
    }

    // Ensure required fields exist
    if (!userData.username) {
      console.error("No username in response");
      notify("Login failed - invalid response");
      return false;
    }

    // Initialize favorites if missing
    if (!Array.isArray(userData.favorites)) {
      userData.favorites = [];
    }

    saveLoggedUser(userData);
    return true;
  } catch (err) {
    console.error("Login error:", err);
    notify("Network error - please check your connection");
    return false;
  }
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem(KEY_LOGGED);
};

// Register new user via API
export const registerUser = async (username, email, password) => {
  try {
    const response = await fetch(`${restApi}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        email,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData.message || errorData.error || "Registration failed";
      console.error("Register error:", errorMsg);
      notify("Registration failed: " + errorMsg);
      return false;
    }

    const data = await response.json();
    console.log("Registration response:", data); // Debug
    notify("Account created — now login.");
    return true;
  } catch (err) {
    console.error("Network error:", err);
    notify("Network error — please try again.");
    return false;
  }
};
