const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

require('dotenv').config({
    path: path.resolve(__dirname, '..', '.env')
});

const db = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    ssl: {
        ca: fs.readFileSync(
            path.resolve(__dirname, '..', process.env.DB_SSL_CA)
        ),
        rejectUnauthorized: true
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db.promise();