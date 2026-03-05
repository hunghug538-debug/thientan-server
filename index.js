const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();

// --- HÀM GỬI THÔNG BÁO TELEGRAM ---
async function sendTelegramNotification(orderData) {
    // Sử dụng Token từ biến môi trường hoặc mã mặc định của bạn
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8485225137:AAF37rubAr291rTIQCcUvBSfh2ZKDw0JPEg';
    const CHAT_ID = '8635344573'; // Chat ID của Hưng
    
    const message = `
🚨 <b>CÓ ĐƠN ĐẶT LỊCH MỚI!</b> 🚨

👤 <b>Khách hàng:</b> ${orderData.ten}
📞 <b>Số điện thoại:</b> ${orderData.phone}
📦 <b>Gói chụp:</b> ${orderData.goi}
💰 <b>Tổng giá:</b> ${orderData.gia ? orderData.gia.toLocaleString('vi-VN') : 0} VNĐ
📝 <b>Lựa chọn:</b> ${orderData.luachon}
🗓️ <b>Ghi chú:</b> ${orderData.ghi_chu}
    `;

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const result = await response.json();
        if (result.ok) {
            console.log('[Telegram] Gửi thông báo thành công!');
        } else {
            console.error('[Telegram Error]:', result.description);
        }
    } catch (error) {
        console.error('[Telegram Fetch Error]:', error);
    }
}

// Middleware
app.use(cors({
    origin: '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Admin UI
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// API: Khách Hàng Đặt Lịch (Đã tích hợp Telegram)
app.post('/api/order', async (req, res) => {
    try {
        const { ten, phone, goi, gia, luachon, ghi_chu } = req.body;

        // Lưu vào Database
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

        // Gửi thông báo về Telegram
        await sendTelegramNotification({ ten, phone, goi, gia, luachon, ghi_chu });

        res.json({ success: true, message: 'Đặt lịch thành công. Studio sẽ liên hệ trong ít phút.' });
    } catch (error) {
        console.error('[API Order Error]:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi đặt lịch.' });
    }
});

// Middleware xác thực JWT cho Admin
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'thientan_secret_key';

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

// API: Admin Lấy Danh Sách Đơn Hàng
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error('[API Fetch Orders Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// API: Admin Xóa Đơn Hàng
app.delete('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const sql = 'DELETE FROM orders WHERE id = ?';
        await db.query(sql, [id]);
        res.json({ success: true, message: 'Xóa đơn hàng thành công.' });
    } catch (error) {
        console.error('[API Delete Order Error]:', error);
        res.status(500).json({ error: error.message });
    }
});

// Khởi chạy Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT}`);
});