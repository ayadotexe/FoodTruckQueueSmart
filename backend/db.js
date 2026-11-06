require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(path.join(__dirname, 'global-bundle.pem')) },
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
