const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("./nhms.db");

// Set up the SQLite database (creating a table if it doesn't exist)
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS residents (id INTEGER PRIMARY KEY, firstName TEXT, middleName TEXT, lastName TEXT, birthDate DATE, gender TEXT, address TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS health_records (" +
    "record_id INTEGER PRIMARY KEY, " +
    "createdAt DATE, " +
    "updatedAt DATE, " +
    "dateOfCheckup DATE, " +
    "resident_id INTEGER, " +
    "height REAL, " +
    "weight REAL, " +
    "bmi REAL, " +
    "bmiStatus TEXT, " +
    "temperature REAL, " +
    "temperatureStatus TEXT, " +
    "systolic INTEGER, " +
    "diastolic INTEGER, " +
    "bpStatus TEXT, " +
    "FOREIGN KEY (resident_id) REFERENCES residents(id))");
});



// Middleware to serve static files (e.g., HTML, CSS, JS)
app.use(express.static("public"));
app.use(express.json());


app.get("/api/residents", (req, res) => {
  db.all("SELECT * FROM residents", [], (err, rows) => {
    if (err) {
      res.status(500).send("Error retrieving residents");
    } else {
      res.json(rows);
    }
  });
});


app.post("/api/residents", (req, res) => {
  const { firstName,middleName,lastName, birthDate,gender, address } = req.body;
  db.run(
    "INSERT INTO residents (firstName,middleName,lastName, birthDate,gender, address) VALUES (?, ?, ? , ? , ? ,?)",
    [firstName,middleName,lastName, birthDate,gender, address],
    function (err) {
      if (err) {
        res.status(500).send("Error adding resident");
      } else {
        res.json({ id: this.lastID, firstName,middleName,lastName, birthDate,gender, address });
      }
    }
  );
});


// DELETE /api/residents/:id
app.delete("/api/residents/:id", (req, res) => {
  const { id } = req.params;

  // Delete the resident from the database
  db.run("DELETE FROM residents WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).send("Error deleting resident");
    } else {
      res.status(200).send({ message: "Resident deleted successfully", changes: this.changes });
    }
  });
});


app.get("/api/residents/:id", (req, res) => {
  const { id } = req.params;

  db.get("SELECT * FROM residents WHERE id = ?", [id], (err, row) => {
    if (err) {
      res.status(500).send("Error retrieving resident");
    } else if (!row) {
      res.status(404).send("Resident not found");
    } else {
      res.json(row);
    }
  });
});

app.put("/api/residents/:id", (req, res) => {
  const { id } = req.params;
  console.log(`Received request to update resident with ID: ${id}`);

  const { firstName, middleName, lastName, birthDate, gender, address } = req.body;

  if (!firstName || !lastName || !birthDate || !gender || !address) {
    console.log("Missing fields in the request body");
    return res.status(400).send("Missing required fields");
  }

  const query = `
    UPDATE residents
    SET firstName = ?, middleName = ?, lastName = ?, birthDate = ?, gender = ?, address = ?
    WHERE id = ?
  `;

  db.run(query, [firstName, middleName, lastName, birthDate, gender, address, id], function(err) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).send("Error updating resident");
    }

    if (this.changes === 0) {
      console.log(`Resident with ID ${id} not found`);
      return res.status(404).send("Resident not found");
    }

    console.log(`Resident with ID ${id} successfully updated`);
    res.json({ id, firstName, middleName, lastName, birthDate, gender, address });
  });
});



// Get all health records
app.get("/api/health_records", (req, res) => {
  db.all("SELECT * FROM health_records", (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(rows);
  });
});

// Get health records for a specific resident
app.get("/api/health_records", (req, res) => {
  const resident_id = req.query.resident_id;
  if (!resident_id) {
      return res.status(400).json({ error: "resident_id is required" });
  }
  
  db.all("SELECT * FROM health_records WHERE resident_id = ?", [resident_id], (err, rows) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }
      res.json(rows);
  });
});


app.get("/api/health_records/:id", (req, res) => {
  const { id } = req.params;

  // Fetch all records for the resident
  db.all("SELECT * FROM health_records WHERE resident_id = ?", [id], (err, rows) => {
    if (err) {
      console.error("Error retrieving health records:", err.message);
      return res.status(500).json({ error: "Error retrieving health records." });
    }

    // Return an empty array if no records are found
    if (rows.length === 0) {
      return res.json([]); // No need for a 404 error
    }

    res.json(rows); // Return all rows as an array
  });
});



// Add a health record for a specific resident
app.post("/api/health_records/:resident_id", (req, res) => {
  const { resident_id } = req.params;
  const {
      height,
      weight,
      bmi,
      bmiStatus,
      systolic,
      diastolic,
      dateOfCheckup,
      temperature,
      temperatureStatus,
      bpStatus
  } = req.body;

  // Validate required fields
  if (!height || !weight || !bmi || !bmiStatus || !systolic || !diastolic || !dateOfCheckup || !temperature || !temperatureStatus || !bpStatus) {
      return res.status(400).json({ error: "All fields are required." });
  }

  // Validate that height and weight are positive numbers
  if (height <= 0 || weight <= 0 || systolic <= 0 || diastolic <= 0 || temperature <= 0) {
      return res.status(400).json({ error: "Height, weight, systolic, diastolic, and temperature must be positive numbers." });
  }

  // Insert health record into the database
  const createdAt = new Date().toISOString();
  const updatedAt = new Date().toISOString();

  db.run(
      `INSERT INTO health_records 
      (resident_id, height, weight, bmi, bmiStatus, systolic, diastolic, dateOfCheckup, temperature, temperatureStatus, createdAt, updatedAt, bpStatus) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [resident_id, height, weight, bmi, bmiStatus, systolic, diastolic, dateOfCheckup, temperature, temperatureStatus, createdAt, updatedAt, bpStatus],
      function (err) {
          if (err) {
              console.error("Database error:", err.message);
              return res.status(500).json({ error: "Failed to insert health record. Please try again later." });
          }

          // Success response
          res.status(201).json({
              message: "Health record added successfully.",
              record: {
                  id: this.lastID,
                  resident_id,
                  height,
                  weight,
                  bmi,
                  bmiStatus,
                  systolic,
                  diastolic,
                  dateOfCheckup,
                  temperature,
                  temperatureStatus,
                  createdAt,
                  updatedAt,
                  bpStatus,
                  
              },
          });
      }
  );
});



// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
