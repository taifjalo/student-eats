import { restApi } from "./variables.js";

// Enhanced fetch with better error handling
const fetchData = async (url, options = {}) => {
  try {
    console.log(`Fetching: ${url}`); // Debug log
    const res = await fetch(url, options);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`HTTP ${res.status} for ${url}:`, errorText);
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log(`Response from ${url}:`, data); // Debug log
    return data;
  } catch (err) {
    console.error("fetchData error:", err);
    throw err;
  }
};

// Get all restaurants
export const getRestaurants = async () => {
  try {
    const data = await fetchData(`${restApi}/restaurants`);
    // API might return { restaurants: [...] } or just [...]
    return Array.isArray(data) ? data : data.restaurants || [];
  } catch (err) {
    console.error("Failed to get restaurants:", err);
    throw err;
  }
};

// Get daily menu
// NOTE: Daily menu requires companyId (Number), not _id (String)
export const getDailyMenu = async (restaurant, lang = "fi") => {
  try {
    // If restaurant is an object, try companyId first, fallback to _id
    let id;
    if (typeof restaurant === "object") {
      id = restaurant.companyId || restaurant._id;
      console.log("Restaurant companyId:", restaurant.companyId, "Using:", id);
    } else {
      id = restaurant;
    }

    if (!id) {
      console.error("Restaurant object:", restaurant);
      throw new Error("Restaurant ID is required for daily menu");
    }

    console.log(`Fetching daily menu with ID: ${id}`);
    const data = await fetchData(`${restApi}/restaurants/daily/${id}/${lang}`);

    // If we got empty courses and used _id, show helpful error
    if (
      data.courses &&
      data.courses.length === 0 &&
      restaurant.companyId === undefined
    ) {
      console.warn("Empty menu - restaurant might be missing companyId field");
    }

    return data;
  } catch (err) {
    console.error(`Failed to get daily menu:`, err);
    throw err;
  }
};

// Get weekly menu
// NOTE: Weekly menu uses _id (String)
export const getWeeklyMenu = async (restaurant, lang = "fi") => {
  try {
    // If restaurant is an object, use _id
    // If it's a string, use it directly
    const id = typeof restaurant === "object" ? restaurant._id : restaurant;

    if (!id) {
      throw new Error("Restaurant _id is required for weekly menu");
    }

    const data = await fetchData(`${restApi}/restaurants/weekly/${id}/${lang}`);
    return data;
  } catch (err) {
    console.error(`Failed to get weekly menu for ${restaurant}:`, err);
    throw err;
  }
};
