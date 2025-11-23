const eventBus = new EventTarget();

export const onFavsChanged = (callback) => {
  eventBus.addEventListener("favs-changed", callback);
};

export const emitFavsChanged = () => {
  eventBus.dispatchEvent(new Event("favs-changed"));
};
