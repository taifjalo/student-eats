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

// Fetch all restaurants
export const getRestaurants = async () => {
  try {
    const data = await fetchData(`${restApi}/restaurants`);
    return data;
  } catch (err) {
    console.error("Failed to fetch restaurants:", err);
    throw err;
  }
};
// getDailyMenu function (using restaurant._id directly)
export const getDailyMenu = async (restaurantId, lang = "fi") => {
  try {
    const data = await fetchData(
      `${restApi}/restaurants/daily/${restaurantId}/${lang}`
    );
    console.log("Daily Menu Data:", data);
    return data;
  } catch (err) {
    console.error("Failed to get daily menu:", err);
    throw err;
  }
};

// getWeeklyMenu function (using restaurant._id directly)
export const getWeeklyMenu = async (restaurantId, lang = "fi") => {
  try {
    const data = await fetchData(
      `${restApi}/restaurants/weekly/${restaurantId}/${lang}`
    );
    return data;
  } catch (err) {
    console.error(
      `Failed to get weekly menu for restaurant ID ${restaurantId}:`,
      err
    );
    throw err;
  }
};
