require('dotenv').config();
const mysql = require('mysql2/promise');

async function initDB() {
    try {
        // Connect without DB first to create database
        const conn = await mysql.createConnection({
            host: process.env.MYSQLHOST || process.env.DB_HOST || '127.0.0.1',
            user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
            password: process.env.MYSQLPASSWORD || process.env.DB_PASS || '123456',
            port: process.env.MYSQLPORT || process.env.DB_PORT || 3306
        });

        console.log('[DB] Connected to MySQL Server');

        const dbName = process.env.MYSQLDATABASE || process.env.DB_NAME || 'thientan_db';

        // Create database if not exists
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`[DB] Database "${dbName}" is ready.`);

        // Use the database
        await conn.query(`USE \`${dbName}\``);

        // Create table
        const createTableSql = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ten_khach VARCHAR(255),
        so_dien_thoai VARCHAR(20),
        goi_chup VARCHAR(100),
        gia INT,
        lua_chon TEXT,
        ghi_chu TEXT,
        trang_thai VARCHAR(50) DEFAULT 'Mới',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
        await conn.query(createTableSql);
        console.log('[DB] Table "orders" is ready.');

        await conn.end();
        console.log('[DB] Setup completed successfully.');
    } catch (err) {
        console.error('[DB] Setup failed:', err);
        throw err;
    }
}

module.exports = initDB;
