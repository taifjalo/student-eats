import { getRestaurants, getDailyMenu, getWeeklyMenu } from "./api.js";
import {
  registerUser,
  loginUser,
  getLoggedUser,
  logoutUser,
  saveLoggedUser,
} from "./auth.js";
import { initMap } from "./map.js";
import { getFavs, addFav, removeFav, isFav } from "./favorites.js";
import { loadProfile } from "./profile.js";
import { onFavsChanged } from "./events.js";
import { restaurantCard } from "./components.js";
import { restaurantModalHtml, attachModalClose } from "./modal.js";

// DOM elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const loginSection = document.getElementById("login-view");
const homeSection = document.getElementById("home-view");
const btnLogin = document.getElementById("btn-login");
const btnProfile = document.getElementById("btn-profile");
const btnLogoutProfile = document.getElementById("btn-logout-profile");
const btnFavs = document.getElementById("btn-favs");

const grid = document.getElementById("restaurant-grid");
const modal = document.getElementById("restaurant-modal");
const favsList = document.getElementById("favorites-list");
const homeEmpty = document.getElementById("home-empty");
const favsEmpty = document.getElementById("favs-empty");

let restaurants = [];
let viewMode = "day"; // or 'week'

// ---------------- Nav / Logout ----------------
function updateNav() {
  const user = getLoggedUser();
  if (user) {
    btnProfile.classList.remove("hidden");
    btnLogin.classList.add("hidden");
    btnFavs.classList.remove("hidden");
  } else {
    btnProfile.classList.add("hidden");
    btnLogin.classList.remove("hidden");
    btnFavs.classList.add("hidden");
  }
}

btnLogoutProfile.addEventListener("click", () => {
  logoutUser();
  notify("You have logged out");
  showView("login");
  updateNav();
});

btnProfile.addEventListener("click", () => {
  loadProfile();
  showView("profile");
});

// ---------------- Show views ----------------
export function showView(name) {
  document
    .getElementById("home-view")
    .classList.toggle("hidden", name !== "home");
  document
    .getElementById("favs-view")
    .classList.toggle("hidden", name !== "favs");
  document
    .getElementById("login-view")
    .classList.toggle("hidden", name !== "login");
  document
    .getElementById("map-view")
    .classList.toggle("hidden", name !== "map");
  document
    .getElementById("profile-view")
    .classList.toggle("hidden", name !== "profile");
  document
    .getElementById("controls-wrapper")
    .classList.toggle("hidden", !(name === "home" || name === "favs"));
}

// ---------------- Switch login/register forms ----------------
document.getElementById("show-register").addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});
document.getElementById("show-login").addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// ---------------- Handle login/register ----------------
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();

  if (await loginUser(username, password)) {
    notify("Welcome back!");
    showView("home");
    updateNav();
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("name").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const email = document.getElementById("reg-email").value.trim();

  const ok = await registerUser(username, email, password);

  if (ok) {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }
});

// ---------------- Login Notification container ----------------
export function notify(message, duration = 3000) {
  const notif = document.getElementById("notification");
  if (!notif) return;

  notif.textContent = message;
  notif.classList.remove("hidden");

  // Hide after duration
  setTimeout(() => {
    notif.classList.add("hidden");
  }, duration);
}

// ---------------- Load & render restaurants ----------------
async function loadRestaurants(companyFilter = "", q = "") {
  try {
    const all = await getRestaurants();
    restaurants = (all || [])
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    let filtered = restaurants.filter((r) => {
      if (companyFilter && r.company !== companyFilter) return false;
      if (
        q &&
        !(
          (r.name || "").toLowerCase().includes(q.toLowerCase()) ||
          (r.city || "").toLowerCase().includes(q.toLowerCase())
        )
      )
        return false;
      return true;
    });

    grid.innerHTML = "";
    if (filtered.length === 0) homeEmpty.classList.remove("hidden");
    else {
      homeEmpty.classList.add("hidden");
      filtered.forEach((r) => grid.appendChild(restaurantCard(r, isFav)));
    }
  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p class='muted'>Failed to load restaurants.</p>";
  }
}

onFavsChanged(() => {
  loadRestaurants();
  renderFavs();
});

// ---------------- Restaurant card actions ----------------
grid.addEventListener("click", async (e) => {
  const card = e.target.closest(".product");
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === "menu") {
    try {
      const menu =
        viewMode === "day" ? await getDailyMenu(id) : await getWeeklyMenu(id);
      const courses = menu?.courses ?? [];
      const html =
        courses.length === 0
          ? "<p class='muted'>No menu</p>"
          : `<ul>${courses
              .map((c) => `<li>${c.name} (${c.price ?? "N/A"})</li>`)
              .join("")}</ul>`;

      const restaurant = restaurants.find((r) => r._id === id);
      modal.innerHTML = restaurantModalHtml(restaurant, html);
      attachModalClose(modal); // automatically attaches close button listener
      modal.showModal();
    } catch (err) {
      console.error(err);
      modal.innerHTML = `
        <div class="dialog-content">
          <p class='muted'>Failed to load menu.</p>
          <div class="close-row">
            <button id="close-modal" class="btn">Close</button>
          </div>
        </div>
      `;
      attachModalClose(modal);
      modal.showModal();
    }
  } else if (action === "fav") {
    const user = getLoggedUser();
    if (!user) {
      notify("This feature only for registered people! ❤");
      return;
    }
    if (isFav(id)) {
      removeFav(id);
      e.target.textContent = "🤍";
    } else {
      addFav(id);
      e.target.textContent = "💛";
    }
    renderFavs();
  } else if (action === "map") {
    showView("map");
    initMap(restaurants);
  }
});

// ---------------- Favorites renderer ----------------
function renderFavs() {
  const favIds = getFavs();
  favsList.innerHTML = "";

  if (!favIds.length) {
    favsEmpty.classList.remove("hidden");
    return;
  }

  favsEmpty.classList.add("hidden");

  favIds.forEach((id) => {
    const r = restaurants.find((x) => String(x._id) === String(id));
    if (!r) return;

    const card = restaurantCard(r, isFav);
    favsList.appendChild(card);
  });
}

// ---------------- Favorites actions ----------------
favsList.addEventListener("click", async (e) => {
  const card = e.target.closest(".product");
  if (!card) return;
  const id = card.dataset.id;
  const action = e.target.dataset.action;

  // ❤️ Toggle favorite
  if (action === "fav") {
    if (isFav(id)) {
      removeFav(id);
      e.target.textContent = "🤍";
    } else {
      addFav(id);
      e.target.textContent = "💛";
    }
    renderFavs();
    return;
  }

  // 📋 Menu
  if (action === "menu") {
    try {
      const menu =
        viewMode === "day" ? await getDailyMenu(id) : await getWeeklyMenu(id);
      const courses = menu?.courses ?? [];
      const html =
        courses.length === 0
          ? "<p class='muted'>No menu</p>"
          : `<ul>${courses
              .map((c) => `<li>${c.name} (${c.price ?? "N/A"})</li>`)
              .join("")}</ul>`;

      const restaurant = restaurants.find((x) => x._id === id);
      modal.innerHTML = restaurantModalHtml(restaurant, html);
      attachModalClose(modal); // standardized close button handling
      modal.showModal();
    } catch (err) {
      console.error(err);
      modal.innerHTML = `
        <div class="dialog-content">
          <p class='muted'>Error loading menu</p>
          <div class="close-row">
            <button id="close-modal" class="btn">Close</button>
          </div>
        </div>
      `;
      attachModalClose(modal);
      modal.showModal();
    }
    return;
  }

  // 🗺 Map
  if (action === "map") {
    showView("map");
    initMap(restaurants);
  }
});

// ---------------- Controls ----------------
document.getElementById("filter-company").addEventListener("change", (e) => {
  loadRestaurants(
    document.getElementById("filter-company").value,
    document.getElementById("search").value.toLowerCase()
  );
  renderFavs();
});
document.getElementById("search").addEventListener("input", (e) => {
  loadRestaurants(
    document.getElementById("filter-company").value,
    e.target.value.toLowerCase()
  );
});
document.getElementById("view-day").addEventListener("click", () => {
  viewMode = "day";
  document.getElementById("view-day").classList.add("active");
  document.getElementById("view-week").classList.remove("active");
});
document.getElementById("view-week").addEventListener("click", () => {
  viewMode = "week";
  document.getElementById("view-week").classList.add("active");
  document.getElementById("view-day").classList.remove("active");
});

// ---------------- Nav buttons ----------------
document
  .getElementById("btn-home")
  .addEventListener("click", () => showView("home"));
document
  .getElementById("btn-home-logo")
  .addEventListener("click", () => showView("home"));

document.getElementById("btn-favs").addEventListener("click", () => {
  renderFavs();
  showView("favs");
});
document
  .getElementById("btn-login")
  .addEventListener("click", () => showView("login"));

document.getElementById("btn-map").addEventListener("click", async () => {
  showView("map");
  if (restaurants.length === 0) await loadRestaurants(); // make sure data is loaded
  initMap(restaurants); // now pass real restaurant data
});

// ---------------- Initial load ----------------
window.addEventListener("DOMContentLoaded", async () => {
  const user = getLoggedUser();
  if (user) showView("home");
  else showView("login");
  updateNav();
  await loadRestaurants();
});
