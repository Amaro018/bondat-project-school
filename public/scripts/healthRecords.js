

let selectedResidentId = null;
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

async function loadHealthRecords() {
    try {
        // Step 1: Fetch the list of residents
        const getResidents = await fetch("/api/residents");
        const residents = await getResidents.json();
        
        // Fetch the health records
        const getRecords = await fetch("/api/health_records");
        const records = await getRecords.json();

        // Step 2: Combine the residents with their health records (or "N/A" if no record exists)
        const residentsWithRecords = residents.map(resident => {
            // Find the matching health record for the current resident
            const record = records.find(record => record.resident_id === resident.id);
          
            // If a record exists, return the resident with the record, otherwise return the resident with "N/A"
            return {
                ...resident,  // Spread the resident's properties
                healthRecord: record || { height: "N/A", weight: "N/A", bmi: "N/A",bmiStatus: "N/A", systolic: "N/A", diastolic: "N/A" }
            };
        });

        // Step 3: Get the table body element where we'll append rows
        const tableBody = document.getElementById("tableBody");
        tableBody.innerHTML = ""; // Clear the table before adding new rows

        // Step 4: Loop through each resident and create a table row for each
        residentsWithRecords.forEach(resident => {
            const row = document.createElement("tr");

            // Create table data cells for each resident and their health record
            row.innerHTML = `
                <td class="p-4 text-center">${resident.firstName} ${resident.middleName} ${resident.lastName}</td>
                <td class="p-4 text-center">${resident.healthRecord.height}</td>
                <td class="p-4 text-center">${resident.healthRecord.weight}</td>
                <td class="p-4 text-center">${resident.healthRecord.bmi}</td>
                <td class="p-4 text-center">${resident.healthRecord.bmiStatus}</td>
                <td class="p-4 text-center">${resident.healthRecord.systolic}</td>
                <td class="p-4 text-center">${resident.healthRecord.diastolic}</td>
                <td class="p-4 text-center"><button class="button p-2 bg-green-500 rounded-lg hover:bg-green-600 text-white font-bold" data-id="${resident.id}" onClick="openModal(${resident.id})">Add Record</button> 
                <button class="button p-2 bg-blue-500 rounded-lg hover:bg-blue-600 text-white font-bold" data-id="${resident.id}" onClick="openViewModal(${resident.id})">View Records</button></td>
            `;

            // Append the row to the table body
            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error fetching health records:", error);
    }
}


function openModal(residentId) {
    document.getElementById("addModal").classList.remove("hidden");
    selectedResidentId = residentId;


    document.getElementById("height").addEventListener("input", calculateBMI);
    document.getElementById("weight").addEventListener("input", calculateBMI);

    document.getElementById("systolic").addEventListener("input", calculateBP);
    document.getElementById("diastolic").addEventListener("input", calculateBP);
    document.getElementById("temperature").addEventListener("input", calculateTemperature);


    let bpStatus = null;
    let temperatureStatus = null;

    function calculateBMI() {
        const height = parseInt(document.getElementById("height").value, 10);
        const weight = parseInt(document.getElementById("weight").value, 10);
        const bmi = (weight / ((height / 100) ** 2)).toFixed(2);

        if (isNaN(height) || isNaN(weight)) {
            document.getElementById("bmiStatus").value = ""; 
            document.getElementById("bmi").value = ""; 
            return;
        }
  
      
        if (bmi < 18.5) {
            document.getElementById("bmiStatus").value = "Underweight";
        } else if (bmi >= 18.5 && bmi < 24.9) {
            document.getElementById("bmiStatus").value = "Normal";
        } else if (bmi >= 25 && bmi < 29.9) {
            document.getElementById("bmiStatus").value = "Overweight";
        } else {
            document.getElementById("bmiStatus").value = "Obese";
        }
        document.getElementById("bmi").value = bmi;
    }
    function calculateTemperature() {

        const temperature = parseInt(document.getElementById("temperature").value, 10);
        const temperatureStatus = document.getElementById("temperatureStatus");

        if (isNaN(temperature)) {
            document.getElementById("temperatureStatus").value = ""; 
            return;
        }

        if (temperature < 36.0) {
            document.getElementById("temperatureStatus").value = "Hypothermia";
        } else if (temperature >= 36.0 && temperature <= 37.5) {
            document.getElementById("temperatureStatus").value = "Normal";
        } else if (temperature > 37.5 && temperature <= 38.0) {
            document.getElementById("temperatureStatus").value = "Mild Fever";
        } else if (temperature > 38.0 && temperature <= 39.5) {
            document.getElementById("temperatureStatus").value = "Moderate Fever";
        } else if (temperature > 39.5) {
            document.getElementById("temperatureStatus").value = "High Fever";
        }
        else
        temperatureStatus.value = "Unknown Status"; // Fallback for unexpected cases
    }
    function calculateBP() {
    const systolic = parseInt(document.getElementById("systolic").value, 10);
    const diastolic = parseInt(document.getElementById("diastolic").value, 10);
   
    if (isNaN(systolic) || isNaN(diastolic)) {
        document.getElementById("bpStatus").value = ""; 
        return;
    }
    
    if (systolic < 90 && diastolic < 60) {
        document.getElementById("bpStatus").value = "Hypotension";
    } else if (systolic <= 120 && diastolic <= 80) {
        document.getElementById("bpStatus").value = "Normal";
    } else if (systolic < 140 && diastolic < 90) {
        document.getElementById("bpStatus").value = "Prehypertension";
    } else if (systolic >= 140 || diastolic >= 90) {
        document.getElementById("bpStatus").value = "Hypertension";
    }
}
    const form = document.getElementById("addForm");
    form.onsubmit = async (e) => {
        e.preventDefault();

        const newRecord = {
            height: document.getElementById("height").value,
            weight: document.getElementById("weight").value,
            bmi: document.getElementById("bmi").value,
            bmiStatus: document.getElementById("bmiStatus").value,
            systolic: document.getElementById("systolic").value,
            diastolic: document.getElementById("diastolic").value,
            temperature: document.getElementById("temperature").value,
            temperatureStatus: document.getElementById("temperatureStatus").value,
            dateOfCheckup: document.getElementById("dateOfCheckup").value,
            bpStatus: document.getElementById("bpStatus").value,
        };

        console.log(newRecord);

        try {
            const response = await fetch(`/api/health_records/${selectedResidentId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newRecord),
            });

            if (response.ok) {
                showNotification("Health record added successfully.");
                closeAddModal();
                loadHealthRecords();
            } else {
                alert("Failed to add health record.");
            }
        } catch (error) {
            alert("An error occurred. Please try again.");
            console.error(error);
        }
    };
}

async function openViewModal(residentId) {
    selectedResidentId = residentId;

    try {
        const response = await fetch(`/api/health_records/${selectedResidentId}`);
        if (!response.ok) {
            throw new Error("Failed to fetch health records.");
        }

        const records = await response.json();
        const modal = document.getElementById("viewModal");
        modal.classList.remove("hidden");
        
        // Close modal when clicking outside
        window.addEventListener("click", function (event) {
            if (event.target === modal) {
                modal.classList.add("hidden");
                selectedResidentId = null;
            }
        });

        const tableBody = document.getElementById("healthRecordTable");
        tableBody.innerHTML = ""; // Clear existing rows

        if (records.length === 0) {
            // No records found
            const row = document.createElement("tr");
            row.innerHTML = `
                <td colspan="10" style="text-align: center;">N/A - No health records available for this resident</td>
            `;
            tableBody.appendChild(row);
        } else {
            // Populate table with records
            records.forEach((record) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${new Date(record.dateOfCheckup).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td>${record.height} cm</td>
                    <td>${record.weight} kg</td>
                    <td>${record.bmi}</td>
                    <td>${record.bmiStatus}</td>
                    <td>${record.systolic} mmHg</td>
                    <td>${record.diastolic} mmHg</td>
                    <td>${record.temperature} °C</td>
                    <td>${record.temperatureStatus}</td>
                    <td>${record.bpStatus}</td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error("Error loading health records:", error);
        alert("An error occurred while loading health records. Please try again.");
    }
}



function closeAddModal() {
    document.getElementById("addModal").classList.add("hidden");
    document.getElementById("addForm").reset();

}

// Call the function to load and display the health records
loadHealthRecords();
