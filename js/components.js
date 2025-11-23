// components.js
export const restaurantCard = (restaurant, isFavFn = () => false) => {
  const card = document.createElement("div");
  card.className = "product";
  card.dataset.id = restaurant._id;

  card.innerHTML = `
    <h3>${restaurant.name}</h3>
    <p class="meta">${restaurant.address}, ${restaurant.city} • ${
    restaurant.company
  }</p>
    <div class="desc">${restaurant.description || ""}</div>
    <div class="actions">
      <button class="fav-btn" data-action="fav">${
        isFavFn(restaurant._id) ? "💛" : "🤍"
      }</button>
      <button class="menu-btn" data-action="menu">Menu</button>
    </div>
  `;
  return card;
};
