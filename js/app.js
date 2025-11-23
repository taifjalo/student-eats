import { getRestaurants, getDailyMenu, getWeeklyMenu } from "./api.js";
import { registerUser, loginUser, getLoggedUser, logoutUser } from "./auth.js";
import { initMap } from "./map.js";
import { getFavs, addFav, removeFav, isFav } from "./favorites.js";
import { loadProfile } from "./profile.js";
import { onFavsChanged } from "./events.js";
import { restaurantCard } from "./components.js";
import { restaurantModalHtml, attachModalClose } from "./modal.js";

// DOM elements
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
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
let viewMode = "day"; // 'day' or 'week'

// ---------------- Notification System ----------------
export function notify(message, duration = 3000) {
  const notif = document.getElementById("notification");
  if (!notif) return;

  notif.textContent = message;
  notif.classList.remove("hidden");

  setTimeout(() => {
    notif.classList.add("hidden");
  }, duration);
}

// ---------------- View Management ----------------
export function showView(name) {
  const views = ["home", "favs", "login", "map", "profile"];

  views.forEach((view) => {
    const element = document.getElementById(`${view}-view`);
    if (element) {
      element.classList.toggle("hidden", view !== name);
    }
  });

  // Show/hide controls (only for home and favs)
  const controls = document.getElementById("controls-wrapper");
  if (controls) {
    controls.classList.toggle("hidden", !(name === "home" || name === "favs"));
  }

  // Update active nav button
  updateNavActive(name);
}

function updateNavActive(activeName) {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((btn) => {
    btn.classList.remove("active");
  });

  const activeMap = {
    home: "btn-home",
    favs: "btn-favs",
    login: "btn-login",
    map: "btn-map",
    profile: "btn-profile",
  };

  const activeBtn = document.getElementById(activeMap[activeName]);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}

// ---------------- Nav / Auth State ----------------
function updateNav() {
  const user = getLoggedUser();

  if (user) {
    btnProfile?.classList.remove("hidden");
    btnLogin?.classList.add("hidden");
    btnFavs?.classList.remove("hidden");
  } else {
    btnProfile?.classList.add("hidden");
    btnLogin?.classList.remove("hidden");
    btnFavs?.classList.add("hidden");
  }
}

// ---------------- Auth Event Handlers ----------------
btnLogoutProfile?.addEventListener("click", () => {
  logoutUser();
  notify("You have logged out");
  showView("login");
  updateNav();
});

btnProfile?.addEventListener("click", () => {
  loadProfile();
  showView("profile");
});

// ---------------- Login/Register Form Toggle ----------------
document.getElementById("show-register")?.addEventListener("click", (e) => {
  e.preventDefault();
  loginForm.classList.add("hidden");
  registerForm.classList.remove("hidden");
});

document.getElementById("show-login")?.addEventListener("click", (e) => {
  e.preventDefault();
  registerForm.classList.add("hidden");
  loginForm.classList.remove("hidden");
});

// ---------------- Login Handler ----------------
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username")?.value.trim();
  const password = document.getElementById("password")?.value.trim();

  if (!username || !password) {
    notify("Please enter username and password");
    return;
  }

  const success = await loginUser(username, password);

  if (success) {
    notify("Welcome back!");
    showView("home");
    updateNav();
    await loadRestaurants(); // Reload to show favorites
  }
});

// ---------------- Register Handler ----------------
registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("name")?.value.trim();
  const password = document.getElementById("reg-password")?.value.trim();
  const email = document.getElementById("reg-email")?.value.trim();

  if (!username || !password || !email) {
    notify("Please fill in all fields");
    return;
  }

  const success = await registerUser(username, email, password);

  if (success) {
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
  }
});

// ---------------- Load & Render Restaurants ----------------
async function loadRestaurants(companyFilter = "", searchQuery = "") {
  try {
    const all = await getRestaurants();

    if (!Array.isArray(all)) {
      throw new Error("Invalid response from API");
    }

    // Store all restaurants sorted by name
    restaurants = all
      .slice()
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    // Apply filters
    let filtered = restaurants.filter((r) => {
      // Company filter
      if (companyFilter && r.company !== companyFilter) return false;

      // Search query filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = (r.name || "").toLowerCase();
        const city = (r.city || "").toLowerCase();

        if (!name.includes(query) && !city.includes(query)) {
          return false;
        }
      }

      return true;
    });

    // Render results
    grid.innerHTML = "";

    if (filtered.length === 0) {
      homeEmpty.classList.remove("hidden");
    } else {
      homeEmpty.classList.add("hidden");
      filtered.forEach((r) => {
        const card = restaurantCard(r, isFav);
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.error("Load restaurants error:", err);
    grid.innerHTML = "<p class='muted'>Failed to load restaurants.</p>";
    notify("Failed to load restaurants");
  }
}

// ---------------- Favorites Changed Listener ----------------
onFavsChanged(() => {
  loadRestaurants(
    document.getElementById("filter-company")?.value || "",
    document.getElementById("search")?.value.toLowerCase() || ""
  );
  renderFavs();
});

// ---------------- Restaurant Card Click Handler ----------------
grid?.addEventListener("click", async (e) => {
  const card = e.target.closest(".product");
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === "menu") {
    await handleMenuClick(id);
  } else if (action === "fav") {
    handleFavoriteToggle(id, e.target);
  }
});

// Handle menu click - FIXED VERSION
async function handleMenuClick(restaurantId) {
  try {
    // Find the restaurant by its ID
    const restaurant = restaurants.find((r) => r._id === restaurantId);

    if (!restaurant) {
      throw new Error("Restaurant not found");
    }

    // for TESTING purposes
    console.log("Loading menu for:", restaurant.name, "Mode:", viewMode);

    let html;

    // If the user selected Day mode
    if (viewMode === "day") {
      console.log("Fetching daily menu...");

      const menu = await getDailyMenu(restaurant._id, "fi");
      console.log("Fetched Daily Menu:", menu);

      if (menu && menu.courses && menu.courses.length > 0) {
        html = menu.courses
          .map((course) => {
            return `
              <h5>${course.name}</h5>
              <p>Price: ${course.price}</p>
              <p>Diets: ${course.diets}</p>
            `;
          })
          .join("");
      } else {
        html = "<p class='muted'>No courses available today.</p>"; // Display this if no courses are found
      }
    } else {
      // Handle Weekly menu if viewMode is 'week'
      const menu = await getWeeklyMenu(restaurant._id, "fi");
      console.log("Fetched Weekly Menu:", menu);

      const days = menu?.days ?? [];
      if (days.length === 0) {
        html =
          "<p class='muted'>No weekly menu available for this restaurant</p>";
      } else {
        html = days
          .map((day) => {
            const courses = day.courses || [];
            const coursesList =
              courses.length === 0
                ? "<p class='muted'>No courses</p>"
                : `<ul>${courses
                    .map((c) => `<li>${c.name} (${c.price ?? "N/A"})</li>`)
                    .join("")}</ul>`;
            return `<h4>${day.date}</h4>${coursesList}`;
          })
          .join("");
      }
    }

    // Update the modal content
    modal.innerHTML = restaurantModalHtml(restaurant, html);
    attachModalClose(modal);
    modal.showModal();
  } catch (err) {
    console.error("Menu load error:", err);
    modal.innerHTML = `
      <div class="dialog-content">
        <p class='muted'>Failed to load menu: ${err.message}</p>
        <div class="close-row">
          <button id="close-modal" class="btn">Close</button>
        </div>
      </div>
    `;
    attachModalClose(modal);
    modal.showModal();
  }
}

// Handle favorite toggle
function handleFavoriteToggle(restaurantId, button) {
  const user = getLoggedUser();

  if (!user) {
    notify("This feature is only for registered users! ❤");
    return;
  }

  if (isFav(restaurantId)) {
    removeFav(restaurantId);
    button.textContent = "🤍";
  } else {
    addFav(restaurantId);
    button.textContent = "💛";
  }
}

// ---------------- Favorites View ----------------
function renderFavs() {
  const favIds = getFavs();
  favsList.innerHTML = "";

  if (favIds.length === 0) {
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

// ---------------- Favorites List Click Handler ----------------
favsList?.addEventListener("click", async (e) => {
  const card = e.target.closest(".product");
  if (!card) return;

  const id = card.dataset.id;
  const action = e.target.dataset.action;

  if (action === "fav") {
    handleFavoriteToggle(id, e.target);
  } else if (action === "menu") {
    await handleMenuClick(id);
  }
});

// ---------------- Filter & Search Controls ----------------
document.getElementById("filter-company")?.addEventListener("change", () => {
  const company = document.getElementById("filter-company")?.value || "";
  const search = document.getElementById("search")?.value.toLowerCase() || "";
  loadRestaurants(company, search);
});

document.getElementById("search")?.addEventListener("input", (e) => {
  const company = document.getElementById("filter-company")?.value || "";
  const search = e.target.value.toLowerCase();
  loadRestaurants(company, search);
});

// ---------------- Day/Week Toggle ----------------
document.getElementById("view-day")?.addEventListener("click", () => {
  viewMode = "day";
  document.getElementById("view-day")?.classList.add("active");
  document.getElementById("view-week")?.classList.remove("active");
});

document.getElementById("view-week")?.addEventListener("click", () => {
  viewMode = "week";
  document.getElementById("view-week")?.classList.add("active");
  document.getElementById("view-day")?.classList.remove("active");
});

// ---------------- Navigation Buttons ----------------
document.getElementById("btn-home")?.addEventListener("click", () => {
  showView("home");
});

document.getElementById("btn-home-logo")?.addEventListener("click", () => {
  showView("home");
});

document.getElementById("btn-favs")?.addEventListener("click", () => {
  renderFavs();
  showView("favs");
});

document.getElementById("btn-login")?.addEventListener("click", () => {
  showView("login");
});

document.getElementById("btn-map")?.addEventListener("click", async () => {
  showView("map");

  // Ensure restaurants are loaded before initializing map
  if (restaurants.length === 0) {
    await loadRestaurants();
  }

  initMap(restaurants);
});

// ---------------- Initial Page Load ----------------
window.addEventListener("DOMContentLoaded", async () => {
  console.log("App initializing...");

  const user = getLoggedUser();

  if (user) {
    console.log("User logged in:", user.username);
    showView("home");
  } else {
    console.log("No user logged in");
    showView("login");
  }

  updateNav();
  await loadRestaurants();

  console.log("App initialized successfully");

  // DEBUG: Check restaurant structure
  if (restaurants.length > 0) {
    console.log("Sample restaurant data:", restaurants[0]);
    console.log("Has companyId?", restaurants[0].companyId !== undefined);
    console.log("companyId value:", restaurants[0].companyId);
    console.log("_id value:", restaurants[0]._id);
  }
});
