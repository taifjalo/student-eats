import { restApi } from "./variables.js";
import { fetchData } from "./utils.js";

export const getRestaurants = async () => {
  return await fetchData(`${restApi}/restaurants`);
};

export const getDailyMenu = async (id, lang = "fi") => {
  return await fetchData(`${restApi}/restaurants/daily/${id}/${lang}`);
};

export const getWeeklyMenu = async (id, lang = "fi") => {
  return await fetchData(`${restApi}/restaurants/weekly/${id}/${lang}`);
};
