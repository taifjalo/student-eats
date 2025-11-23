import { getLoggedUser, saveLoggedUser } from "./auth.js";
import { notify, showView } from "./app.js";
import { restApi } from "./variables.js";

// DOM elements
const profileForm = document.getElementById("profile-form");
const nameInput = document.getElementById("profile-name");
const passwordInput = document.getElementById("profile-password");
const emailInput = document.getElementById("profile-email");
const picInput = document.getElementById("profile-picture");
const picPreview = document.getElementById("profile-pic-preview");
const uploadText = document.getElementById("upload-text");
const uploadSpinner = document.getElementById("upload-spinner");

// Load profile
export function loadProfile() {
  const user = getLoggedUser();
  if (!user) return;

  // Set placeholders for disabled inputs
  nameInput.placeholder = user.username || "";
  emailInput.placeholder = user.email || "";
  passwordInput.placeholder = user.password || "";

  // Display current avatar if exists
  if (user.avatar) {
    picPreview.innerHTML = `<img src="${user.avatar}" class="profile-img" alt="Profile Picture" />`;
  } else {
    picPreview.innerHTML = "<p>No profile picture</p>";
  }
}

// Preview new avatar
picInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    picPreview.innerHTML = `<img src="${reader.result}" class="profile-img" alt="Profile Picture" />`;
  };
  reader.readAsDataURL(file);
});

// Upload avatar to API
async function uploadAvatar(file, token) {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await fetch(`${restApi}/users/avatar`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Avatar upload failed");
  }

  const data = await res.json();
  // The API returns the avatar filename, need full URL
  return `${restApi.replace("/api/v1", "")}/uploads/${data.data.avatar}`;
}

// Update user info (avatar only)
async function updateUserOnServer(user) {
  const body = {};
  if (user.avatar) body.avatar = user.avatar;

  const res = await fetch(`${restApi}/users`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${user.token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update profile");
  }

  const data = await res.json();
  return data.data;
}

// Handle form submit
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = getLoggedUser();
  if (!user) return;

  if (!picInput.files[0]) {
    notify("No new picture selected.");
    return;
  }

  try {
    uploadText.classList.add("hidden");
    uploadSpinner.classList.remove("hidden"); // show spinner

    user.avatar = await uploadAvatar(picInput.files[0], user.token);
    const updatedUser = await updateUserOnServer(user);
    saveLoggedUser(updatedUser);
    loadProfile();
    notify("Profile picture updated successfully!");
  } catch (err) {
    console.error(err);
    notify(`Error updating profile: ${err.message}`);
  } finally {
    uploadText.classList.remove("hidden");
    uploadSpinner.classList.add("hidden"); // hide spinner
  }
});
