const form = document.getElementById("residentForm");
const tableBody = document.querySelector("#residentTable tbody");
const deleteModal = document.getElementById("deleteModal");
const confirmDeleteButton = document.getElementById("confirmDelete");
const cancelDeleteButton = document.getElementById("cancelDelete");
const editResidentModal = document.getElementById("editResidentModal");
const notification = document.getElementById("notification");
const addResidentModal = document.getElementById("addResidentModal");

let residentToDelete = null;
let residentToEdit = null; 

function showNotification(message, isError = false) {
  notification.textContent = message;
  notification.className = "notification"; 
  if (isError) notification.classList.add("error");

  notification.style.display = "block";

  // auto hide notification ng 3 secs
  setTimeout(() => {
    notification.style.display = "none";
  }, 3000);
}

// kuha and display residents
async function loadResidents() {
  try {
    const response = await fetch("/api/residents");
    const residents = await response.json();

    // Clear current table rows
    tableBody.innerHTML = "";

    // Populate data
    residents.forEach((resident) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="p-4 text-center">${resident.firstName}</td>
        <td class="p-4 text-center">${resident.middleName}</td> 
        <td class="p-4 text-center">${resident.lastName}</td>
        <td class="p-4 text-center">${resident.gender}</td>
        <td class="p-4 text-center">${new Date(resident.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</td>
        <td class="p-4 text-center">${resident.address}</td>
        <td class="p-4 justify-center flex flex-row gap-2">
          <button class="delete-button bg-red-600 px-2 py-1 rounded text-white font-bold hover:bg-red-700" data-id="${resident.id}">Delete</button>
          <button class="edit-button bg-blue-500 px-2 py-1 rounded text-white font-bold hover:bg-blue-600" data-id="${resident.id}">Edit</button>
        </td>`;
      tableBody.appendChild(row);
    });

    // pag pinindot lalabas modal
    document.querySelectorAll(".delete-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const residentId = e.target.getAttribute("data-id");
        openDeleteModal(residentId);
      });
    });

    document.querySelectorAll(".edit-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const residentId = e.target.getAttribute("data-id");
        await openEditModal(residentId);
      });
    });
  } catch (error) {
    showNotification("Failed to load residents.", true);
    console.error(error);
  }
}

// open edit modal
async function openEditModal(residentId) {
  residentToEdit = residentId;

  try {
    const response = await fetch(`/api/residents/${residentId}`);
    if (!response.ok) throw new Error(`Failed to fetch resident data: ${response.status}`);

    const resident = await response.json();

    // Populate the form fields with the resident's data
    document.getElementById("editFirstName").value = resident.firstName || "";
    document.getElementById("editMiddleName").value = resident.middleName || "";
    document.getElementById("editLastName").value = resident.lastName || "";
    document.getElementById("editBirthDate").value = resident.birthDate || "";
    document.getElementById("editGender").value = resident.gender || "";
    document.getElementById("editAddress").value = resident.address || "";


    editResidentModal.classList.remove("hidden");


    const form = document.getElementById("editResidentForm");
    form.onsubmit = async (e) => {
      e.preventDefault();

      const updatedData = {
        firstName: document.getElementById("editFirstName").value,
        middleName: document.getElementById("editMiddleName").value,
        lastName: document.getElementById("editLastName").value,
        birthDate: document.getElementById("editBirthDate").value,
        gender: document.getElementById("editGender").value,
        address: document.getElementById("editAddress").value,
      };

      try {
        const editResponse = await fetch(`/api/residents/${residentToEdit}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        });

        if (!editResponse.ok) throw new Error(`Failed to update resident: ${editResponse.status}`);
        showNotification("Resident updated successfully.");
        loadResidents(); 
        closeEditModal();
      } catch (error) {
        showNotification("Failed to update resident.", true);
        console.error(error);
      }
    };
  } catch (error) {
    showNotification("Failed to fetch resident data.", true);
    console.error(error);
  }
}

function closeEditModal() {
  editResidentModal.classList.add("hidden");
}

// Add new resident
document.getElementById("addResidentButton").addEventListener("click", () => {
  addResidentModal.classList.remove("hidden");

  form.onsubmit = async (e) => {
    e.preventDefault();
    const newResident = {
      firstName: document.getElementById("firstName").value,
      middleName: document.getElementById("middleName").value,
      lastName: document.getElementById("lastName").value,
      birthDate: document.getElementById("birthDate").value,
      gender: document.getElementById("gender").value,
      address: document.getElementById("address").value,
    };

    try {
      const response = await fetch("/api/residents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newResident),
      });

      if (!response.ok) throw new Error("Failed to create resident.");
      showNotification("Resident created successfully.");
      loadResidents();
      form.reset();
      closeAddModal();
    } catch (error) {
      showNotification("Failed to create resident.", true);
      console.error(error);
    }
  };
});

document.getElementById("cancelAdd").addEventListener("click", () => {
  closeAddModal();
});

function closeAddModal() {
  addResidentModal.classList.add("hidden");
}

// Delete resident
confirmDeleteButton.addEventListener("click", async () => {
  if (residentToDelete) {
    try {
      const response = await fetch(`/api/residents/${residentToDelete}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete resident.");
      showNotification("Resident deleted successfully.");
      loadResidents();
      closeDeleteModal();
    } catch (error) {
      showNotification("Failed to delete resident.", true);
      console.error(error);
    }
  }
});

function closeDeleteModal() {
  deleteModal.classList.add("hidden");
}

function openDeleteModal(residentId) {
  residentToDelete = residentId; 
  deleteModal.classList.remove("hidden");
}


loadResidents();
