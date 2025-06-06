document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  
  // Filter elements
  const searchInput = document.getElementById("search-input");
  const categoryFilter = document.getElementById("category-filter");
  const sortSelect = document.getElementById("sort-select");
  
  let allActivities = {}; // Store all activities for filtering

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      allActivities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      
      // Clear and repopulate activity dropdown
      while (activitySelect.children.length > 1) {
        activitySelect.removeChild(activitySelect.lastChild);
      }

      // Apply filters and display activities
      displayFilteredActivities();
      
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }
  
  // Function to display filtered and sorted activities
  function displayFilteredActivities() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    const sortBy = sortSelect.value;
    
    // Filter activities
    let filteredActivities = Object.entries(allActivities).filter(([name, details]) => {
      const matchesSearch = !searchTerm || 
        name.toLowerCase().includes(searchTerm) ||
        details.description.toLowerCase().includes(searchTerm);
      
      const matchesCategory = !selectedCategory || details.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Sort activities
    filteredActivities.sort(([nameA, detailsA], [nameB, detailsB]) => {
      switch (sortBy) {
        case 'name':
          return nameA.localeCompare(nameB);
        case 'category':
          return detailsA.category.localeCompare(detailsB.category) || nameA.localeCompare(nameB);
        case 'spots':
          const spotsA = detailsA.max_participants - detailsA.participants.length;
          const spotsB = detailsB.max_participants - detailsB.participants.length;
          return spotsB - spotsA; // Sort by most spots available first
        default:
          return 0;
      }
    });
    
    // Clear activities list
    activitiesList.innerHTML = "";
    
    // Display filtered activities
    filteredActivities.forEach(([name, details]) => {
      const activityCard = document.createElement("div");
      activityCard.className = "activity-card";

      const spotsLeft = details.max_participants - details.participants.length;

      // Create participants HTML with delete icons instead of bullet points
      const participantsHTML =
        details.participants.length > 0
          ? `<div class="participants-section">
            <h5>Participants:</h5>
            <ul class="participants-list">
              ${details.participants
                .map(
                  (email) =>
                    `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                )
                .join("")}
            </ul>
          </div>`
          : `<p><em>No participants yet</em></p>`;

      activityCard.innerHTML = `
        <h4>${name}</h4>
        <p class="activity-category"><strong>Category:</strong> ${details.category}</p>
        <p>${details.description}</p>
        <p><strong>Schedule:</strong> ${details.schedule}</p>
        <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        <div class="participants-container">
          ${participantsHTML}
        </div>
      `;

      activitiesList.appendChild(activityCard);

      // Add option to select dropdown
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      activitySelect.appendChild(option);
    });

    // Add event listeners to delete buttons
    document.querySelectorAll(".delete-btn").forEach((button) => {
      button.addEventListener("click", handleUnregister);
    });
    
    // Show message if no activities match the filter
    if (filteredActivities.length === 0) {
      activitiesList.innerHTML = "<p><em>No activities match your search criteria.</em></p>";
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Add event listeners for filtering
  searchInput.addEventListener("input", displayFilteredActivities);
  categoryFilter.addEventListener("change", displayFilteredActivities);
  sortSelect.addEventListener("change", displayFilteredActivities);

  // Initialize app
  fetchActivities();
});
