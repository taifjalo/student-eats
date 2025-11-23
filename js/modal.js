export const restaurantModalHtml = (restaurant, menuHtml) => {
  return `
    <div class="dialog-content">
      <div class="close-row">
        <button id="close-modal" class="btn">Close</button>
      </div>
      <h2>${restaurant.name}</h2>
      <p class="muted">${restaurant.company} • ${restaurant.city}</p>
      <p>${restaurant.address ?? ""}</p>
      <h3>Menu</h3>
      ${menuHtml || "<p class='muted'>No menu available</p>"}
    </div>
  `;
};

// Attach a close listener safely
export const attachModalClose = (modal) => {
  const closeBtn = modal.querySelector("#close-modal");
  if (!closeBtn) return;

  // Remove previous listener if exists
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.replaceWith(newCloseBtn);

  newCloseBtn.addEventListener("click", () => modal.close());
};
