# StudentEats

> A modern web app to explore student restaurants, view daily/weekly menus, mark favorites, and check locations on the map.

---

## **Overview**

StudentEats is a frontend project built with **vanilla JavaScript, HTML, CSS**, and **Leaflet.js** for map visualization.  
It allows students to:

- Browse restaurants by provider or search term
- View daily and weekly menus
- Mark restaurants as favorites
- Check restaurant locations on an interactive map
- Manage user profiles with avatar upload
- Switch between login/register easily

---

## **Project Structure**

```

student-restaurant/
├─ index.html          ← Main HTML layout
├─ css/
│  └─ style.css        ← Styling for all views
├─ js/
│  ├─ variables.js     ← Base API URL, constants
│  ├─ utils.js         ← Helper functions (e.g., formatting dates)
│  ├─ components.js    ← DOM components (cards, modal HTML)
│  ├─ api.js           ← API calls (getRestaurants, getDailyMenu, getWeeklyMenu)
│  ├─ auth.js          ← Login/register + local favorites
│  ├─ events.js        ← Custom events (e.g., onFavsChanged)
│  ├─ favorites.js     ← Favorite helper functions
│  ├─ map.js           ← Map initialization + Leaflet logic
└─ └─ app.js            ← Main logic, event listeners, page switching

```

---

## **Quick Start**

1. Clone the repo:

```bash
git clone https://github.com/taifjalo/student-retaurants.git
cd student-retaurants
```

2. Open `index.html` in your browser.

3. Ensure your backend API runs at the URL defined in `js/variables.js`.

---

## **Features**

- Responsive, modern UI
- Day/Week menu toggle
- Favorites system for logged-in users
- Interactive map with location and nearest restaurant highlight
- Profile management with avatar upload

---

## **License**

MIT © 2025 Taif Jalo
