const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Admin UI statically
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API: Khách Hàng Đặt Lịch
app.post('/api/order', async (req, res) => {
    try {
        const { ten, phone, goi, gia, luachon, ghi_chu } = req.body;

        const sql = `
      INSERT INTO orders (ten_khach, so_dien_thoai, goi_chup, gia, lua_chon, ghi_chu)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

        await db.query(sql, [
            ten || 'Khách Vãng Lai',
            phone || '',
            goi || 'Studio',
            gia || 0,
            luachon || '',
            ghi_chu || ''
        ]);

        // TODO: Tích hợp gửi tin nhắn Zalo ở đây

        res.json({ success: true, message: 'Đặt lịch thành công. Studio sẽ liên hệ trong ít phút.' });
    } catch (error) {
        console.error('[API Order Error]:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ rôi!' });
    }
});

// API: Admin Lấy Danh Sách Đơn Hàng (Đơn giản - Có thể thêm Token sau)
app.get('/api/orders', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('[API Fetch Orders Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[🚀] Server đang chạy tại http://localhost:${PORT}`);
    console.log(`[👤] Trang quản lý Admin: http://localhost:${PORT}/admin`);
});
