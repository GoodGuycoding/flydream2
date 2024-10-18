const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to or create the SQLite database
const db = new sqlite3.Database('./bookings.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Create the bookings table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    flightName TEXT,
    flightCarrierCode TEXT,     -- Added column for carrier code
    flightStartDate TEXT        -- Added column for flight start date
)`);

app.post('/book', (req, res) => {
    const { fullName, email, phone, flightName, flightCarrierCode, flightStartDate } = req.body;

    // Check for the required fields
    if (!fullName || !email || !phone) {
        return res.status(400).json({ message: 'Missing required booking information.' });
    }

    // Insert into the SQLite database
    db.run(
        `INSERT INTO bookings (fullName, email, phone, flightName, flightCarrierCode, flightStartDate)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [fullName, email, phone, flightName || 'N/A', flightCarrierCode || 'N/A', flightStartDate || 'N/A'],
        function (err) {
            if (err) {
                // Log the error to the server console for debugging
                console.error('Database error:', err.message);
                return res.status(500).json({ message: 'Database error', error: err.message });
            }
            res.status(200).json({ message: 'Booking confirmed', bookingId: this.lastID });
        }
    );
});

// GET endpoint to fetch all bookings in JSON format
app.get('/bookings', (req, res) => {
    db.all('SELECT * FROM bookings', [], (err, rows) => {
        if (err) {
            return res.status(500).json({ message: 'Database error', error: err.message });
        }
        res.status(200).json(rows);
    });
});

// GET endpoint to render bookings as HTML table
app.get('/bookings-html', (req, res) => {
    db.all('SELECT * FROM bookings', [], (err, rows) => {
        if (err) {
            return res.status(500).send('Database error');
        }

        // Generate HTML table with the data
        let html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bookings Table</title>
            <style>
                table {
                    width: 100%;
                    border-collapse: collapse;
                }
                table, th, td {
                    border: 1px solid black;
                }
                th, td {
                    padding: 8px;
                    text-align: left;
                }
                th {
                    background-color: #f2f2f2;
                }
            </style>
        </head>
        <body>
            <h2>Bookings</h2>
            <table>
                <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Flight Name</th>
                    <th>Flight Carrier Code</th> <!-- New Column for Carrier Code -->
                    <th>Flight Start Date</th> <!-- New Column for Start Date -->
                </tr>`;

        // Loop through each row and add a table row
        rows.forEach((row) => {
            html += `
                <tr>
                    <td>${row.id}</td>
                    <td>${row.fullName}</td>
                    <td>${row.email}</td>
                    <td>${row.phone}</td>
                    <td>${row.flightName || 'N/A'}</td>
                    <td>${row.flightCarrierCode || 'N/A'}</td>
                    <td>${row.flightStartDate || 'N/A'}</td> <!-- Added the new fields -->
                </tr>`;
        });

        // Close the table and HTML tags
        html += `
            </table>
        </body>
        </html>`;

        // Send the generated HTML as the response
        res.send(html);
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
