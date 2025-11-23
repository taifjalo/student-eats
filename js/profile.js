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

// Load current profile data
export function loadProfile() {
  const user = getLoggedUser();
  if (!user) {
    notify("Please login first");
    showView("login");
    return;
  }

  // Set placeholders to show current values
  nameInput.placeholder = user.username || "No username";
  emailInput.placeholder = user.email || "No email";
  passwordInput.placeholder = "********";

  // Display current avatar if exists
  if (user.avatar) {
    const avatarUrl = user.avatar.startsWith("http")
      ? user.avatar
      : `${restApi.replace("/api/v1", "")}/uploads/${user.avatar}`;

    picPreview.innerHTML = `<img src="${avatarUrl}" class="profile-img" alt="Profile Picture" />`;
  } else {
    picPreview.innerHTML = "<p>No profile picture</p>";
  }
}

// Preview new avatar before upload
picInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    notify("Please select an image file");
    picInput.value = "";
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    notify("Image too large (max 5MB)");
    picInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    picPreview.innerHTML = `<img src="${reader.result}" class="profile-img" alt="Profile Picture" />`;
  };
  reader.onerror = () => {
    notify("Failed to read image");
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
    const err = await res.json().catch(() => ({ error: "Upload failed" }));
    throw new Error(err.error || err.message || "Avatar upload failed");
  }

  const data = await res.json();
  console.log("Avatar upload response:", data); // Debug

  // Return the avatar filename or URL
  if (data.data && data.data.avatar) {
    return data.data.avatar;
  } else if (data.avatar) {
    return data.avatar;
  } else {
    throw new Error("No avatar in response");
  }
}

// Update user profile on server
async function updateUserOnServer(avatarFilename, token) {
  const res = await fetch(`${restApi}/users`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      avatar: avatarFilename,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Update failed" }));
    throw new Error(err.error || err.message || "Failed to update profile");
  }

  const data = await res.json();
  console.log("Profile update response:", data); // Debug
  return data.data || data;
}

// Handle form submit
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const user = getLoggedUser();
  if (!user) {
    notify("Please login first");
    showView("login");
    return;
  }

  if (!picInput.files[0]) {
    notify("Please select a new picture to upload");
    return;
  }

  if (!user.token) {
    notify("No authentication token found. Please login again.");
    showView("login");
    return;
  }

  try {
    // Show loading state
    uploadText.classList.add("hidden");
    uploadSpinner.classList.remove("hidden");

    // Upload avatar
    const avatarFilename = await uploadAvatar(picInput.files[0], user.token);

    // Update user profile
    const updatedData = await updateUserOnServer(avatarFilename, user.token);

    // Update local storage
    const updatedUser = { ...user, ...updatedData, token: user.token };
    saveLoggedUser(updatedUser);

    // Reload profile display
    loadProfile();

    // Clear file input
    picInput.value = "";

    notify("Profile picture updated successfully!");
  } catch (err) {
    console.error("Profile update error:", err);
    notify(`Error: ${err.message}`);
  } finally {
    // Hide loading state
    uploadText.classList.remove("hidden");
    uploadSpinner.classList.add("hidden");
  }
});
