import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet-src.esm.js";
import { isFav, addFav, removeFav } from "./favorites.js";
import { getDailyMenu, getWeeklyMenu } from "./api.js";

function haversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity; // ignore invalid coords
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const initMap = (restaurants) => {
  const mapContainer = document.getElementById("map");
  if (!mapContainer) return;
  mapContainer.innerHTML = "";

  const map = L.map(mapContainer).setView([60.1699, 24.9384], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const markers = [];
  let userCoords = null;

  const addUserMarker = (lat, lon) => {
    userCoords = { lat, lon };
    L.circleMarker([lat, lon], {
      radius: 8,
      color: "#007bff",
      fillColor: "#007bff",
      fillOpacity: 0.8,
    })
      .addTo(map)
      .bindPopup("You are here");
  };

  const markNearest = () => {
    if (!userCoords || markers.length === 0) return;

    let nearest = null;
    let minD = Infinity;

    markers.forEach((m) => {
      const d = haversine(userCoords.lat, userCoords.lon, m.lat, m.lon);
      m.distance = d;
      if (d < minD) {
        minD = d;
        nearest = m;
      }
    });

    if (nearest) {
      nearest.marker.setIcon(
        L.divIcon({
          html: `<div style="font-size:24px;">⭐</div>`,
          className: "nearest-marker",
          iconSize: [24, 24],
        })
      );
      nearest.marker.openPopup();
    }
  };

  const createMarker = (r) => {
    const lat = r.location?.coordinates?.[1];
    const lon = r.location?.coordinates?.[0];
    if (!lat || !lon) return;

    const iconHtml = `
      <div style="
        width: 36px; height: 36px; 
        background: ${isFav(r._id) ? "#ffd700" : "#ff4d4d"};
        border-radius: 50%; border: 2px solid white;
        display:flex; align-items:center; justify-content:center;
        font-size:18px; color:white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      ">🍴</div>
    `;

    const marker = L.marker([lat, lon], {
      icon: L.divIcon({
        html: iconHtml,
        className: "custom-marker",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      }),
    }).addTo(map);

    const distanceText = userCoords
      ? `<small>${haversine(userCoords.lat, userCoords.lon, lat, lon).toFixed(
          2
        )} km away</small>`
      : "";

    const popupHtml = `
      <div style="min-width:200px;">
        <h3>${r.name}</h3>
        <p>${r.address}, ${r.city}</p>
        <p><b>${r.company}</b></p>
        ${distanceText}
        <div>
          <button id="fav-${r._id}" style="font-size:20px;">${
      isFav(r._id) ? "💛" : "🤍"
    }</button>
        </div>
        <div style="margin-top:10px;">
          <button id="menu-day-${r._id}" class="menu-btn">Day Menu</button>
          <button id="menu-week-${r._id}" class="menu-btn">Week Menu</button>
        </div>
        <div id="menu-content-${r._id}" style="margin-top:5px;"></div>
      </div>
    `;

    marker.bindPopup(popupHtml);

    marker.on("popupopen", async () => {
      const favBtn = document.getElementById(`fav-${r._id}`);
      if (favBtn) {
        const newFavBtn = favBtn.cloneNode(true);
        favBtn.replaceWith(newFavBtn);
        newFavBtn.addEventListener("click", () => {
          if (isFav(r._id)) removeFav(r._id);
          else addFav(r._id);
          newFavBtn.textContent = isFav(r._id) ? "💛" : "🤍";
        });
      }

      const contentEl = document.getElementById(`menu-content-${r._id}`);

      const loadMenu = async (type) => {
        try {
          const menu =
            type === "day"
              ? await getDailyMenu(r._id)
              : await getWeeklyMenu(r._id);
          const courses = menu?.courses ?? [];
          contentEl.innerHTML =
            courses.length === 0
              ? "<p class='muted'>No menu</p>"
              : `<ul>${courses
                  .map((c) => `<li>${c.name} (${c.price ?? "N/A"})</li>`)
                  .join("")}</ul>`;
        } catch {
          contentEl.innerHTML = "<p class='muted'>Failed to load menu</p>";
        }
      };

      document
        .getElementById(`menu-day-${r._id}`)
        .addEventListener("click", () => loadMenu("day"));
      document
        .getElementById(`menu-week-${r._id}`)
        .addEventListener("click", () => loadMenu("week"));
    });

    markers.push({ marker, lat, lon });
  };

  restaurants.forEach(createMarker);

  if (markers.length) {
    const group = L.featureGroup(markers.map((m) => m.marker));
    map.fitBounds(group.getBounds().pad(0.1));
  }

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        addUserMarker(pos.coords.latitude, pos.coords.longitude);
        // re-create markers to calculate distance
        markers.forEach((m) => m.marker.remove());
        markers.length = 0;
        restaurants.forEach(createMarker);
        markNearest();
      },
      (err) => console.warn("Geolocation failed:", err.message)
    );
  }

  return map;
};
