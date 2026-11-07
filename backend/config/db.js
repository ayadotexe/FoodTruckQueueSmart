const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { ca: fs.readFileSync(path.join(__dirname, 'global-bundle.pem')) },
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
