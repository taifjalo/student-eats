// auth.js - Metropolia API login + local favorites

import { notify } from "./app.js";
import { restApi } from "./variables.js";

const KEY_LOGGED = "sr:loggedUser";

// Get logged user
export const getLoggedUser = () =>
  JSON.parse(localStorage.getItem(KEY_LOGGED) || "null");

// Save logged user
export const saveLoggedUser = (user) => {
  localStorage.setItem(KEY_LOGGED, JSON.stringify(user));
};

// ---------------- LOGIN (REAL API) ----------------
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
      notify("Invalid login");
      return false;
    }

    const data = await response.json();

    // Save user or token if API gives one
    localStorage.setItem("sr:loggedUser", JSON.stringify(data));

    return true;
  } catch (err) {
    console.error(err);
    notify("Network error");
    return false;
  }
};

// Logout
export const logoutUser = () => {
  localStorage.removeItem(KEY_LOGGED);
};

// ---------------- REGISTER via REAL API ----------------
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
      const errorMsg = await response.text();
      console.error("Register error:", errorMsg);
      notify("Registration failed: " + errorMsg);
      return false;
    }

    notify("Account created — now login.");
    return true;
  } catch (err) {
    console.error("Network error:", err);
    notify("Network error — please try again.");
    return false;
  }
};

// ---- Favorites ----
export const addFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return;

  if (!user.favorites.includes(restaurantId)) {
    user.favorites.push(restaurantId);
    saveLoggedUser(user);
  }
};

export const removeFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return;

  user.favorites = user.favorites.filter((id) => id !== restaurantId);
  saveLoggedUser(user);
};

export const isFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return false;
  return user.favorites.includes(restaurantId);
};
