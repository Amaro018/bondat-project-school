const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const db = new sqlite3.Database("./nhms.db");

// Set up the SQLite database (creating a table if it doesn't exist)
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS residents (id INTEGER PRIMARY KEY, firstName TEXT, middleName TEXT, lastName TEXT, birthDate DATE, gender TEXT, address TEXT)");
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




// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
