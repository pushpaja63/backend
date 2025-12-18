// db.js
console.log("ENV USER:", process.env.DB_USER);
console.log("ENV PASS:", process.env.DB_PASSWORD);
console.log("ENV DB:", process.env.DB_NAME);

require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Nokia@1234',  // change if you use another password
  database: process.env.DB_NAME || 'myappdb',      // must match the DB you created
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool;
