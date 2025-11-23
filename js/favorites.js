import { getLoggedUser, saveLoggedUser } from "./auth.js";
import { emitFavsChanged } from "./events.js";

// Get all favorite IDs for current user
export const getFavs = () => {
  const user = getLoggedUser();
  if (!user) return [];

  // Ensure favorites array exists
  if (!Array.isArray(user.favorites)) {
    return [];
  }

  return user.favorites;
};

// Add a restaurant to favorites
export const addFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return;

  // Ensure favorites array exists
  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }

  const favId = String(restaurantId); // normalize to string

  if (!user.favorites.includes(favId)) {
    user.favorites.push(favId);
    saveLoggedUser(user);
    emitFavsChanged(); // notify listeners
  }
};

// Remove a restaurant from favorites
export const removeFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return;

  // Ensure favorites array exists
  if (!Array.isArray(user.favorites)) {
    user.favorites = [];
  }

  const favId = String(restaurantId); // normalize to string
  user.favorites = user.favorites.filter((id) => id !== favId);
  saveLoggedUser(user);
  emitFavsChanged(); // notify listeners
};

// Check if a restaurant is favorited
export const isFav = (restaurantId) => {
  const user = getLoggedUser();
  if (!user) return false;

  // Ensure favorites array exists
  if (!Array.isArray(user.favorites)) {
    return false;
  }

  const favId = String(restaurantId); // normalize to string
  return user.favorites.includes(favId);
};
