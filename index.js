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

const jwt = require('jsonwebtoken');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || '010105';
const JWT_SECRET = process.env.JWT_SECRET || 'thientan-secret-key-2026';

// API: Đăng nhập Admin
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu!' });
    }
});

// Middleware: Xác thực JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Không có quyền truy cập.' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Phiên đăng nhập hết hạn.' });
        req.user = user;
        next();
    });
};

// API: Admin Lấy Danh Sách Đơn Hàng (Đã bảo vệ)
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('[API Fetch Orders Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Admin Xóa Đơn Hàng (Đã bảo vệ)
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM orders WHERE id = ?';
        await db.query(sql, [id]);
        res.json({ success: true, message: 'Xóa đơn hàng thành công.' });
    } catch (error) {
        console.error('[API Delete Order Error]:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa đơn hàng.' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[🚀] Server đang chạy tại http://localhost:${PORT}`);
    console.log(`[👤] Trang quản lý Admin: http://localhost:${PORT}/admin`);
});
