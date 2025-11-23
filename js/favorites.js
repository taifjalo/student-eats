import { getLoggedUser, saveLoggedUser } from "./auth.js";
import { emitFavsChanged } from "./events.js";

export const getFavs = () => {
  const user = getLoggedUser();
  return user?.favorites || [];
};

export const addFav = (id) => {
  const user = getLoggedUser();
  if (!user) return;

  const favId = String(id);
  if (!(user.favorites || []).includes(favId)) {
    user.favorites = [...(user.favorites || []), favId];
    saveLoggedUser(user);
    emitFavsChanged();
  }
};

export const removeFav = (id) => {
  const user = getLoggedUser();
  if (!user) return;

  const favId = String(id);
  user.favorites = (user.favorites || []).filter((x) => x !== favId);
  saveLoggedUser(user);
  emitFavsChanged();
};

export const isFav = (id) => {
  const user = getLoggedUser();
  return !!user && (user.favorites || []).includes(String(id));
};
