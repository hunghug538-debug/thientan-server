const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   TELEGRAM
========================= */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message) {
  try {
    console.log("[TG] Sending to chat_id:", TELEGRAM_CHAT_ID);
    const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: message }),
    });
    const data = await res.json();
    console.log("[TG] Response:", JSON.stringify(data));
  } catch (err) {
    console.error("[TG] Error:", err);
  }
}

/* =========================
   ADMIN STATIC
========================= */

app.use("/admin", express.static(path.join(__dirname, "admin")));

/* =========================
   ORDER API
========================= */

app.post("/api/order", async (req, res) => {
  try {
    const { ten, phone, goi, gia, luachon, ghi_chu } = req.body;

    const sql = `
      INSERT INTO orders (ten_khach, so_dien_thoai, goi_chup, gia, lua_chon, ghi_chu)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      ten || "Khách Vãng Lai",
      phone || "",
      goi || "Studio",
      gia || 0,
      luachon || "",
      ghi_chu || "",
    ]);

    await sendTelegram(
      `📸 ĐƠN CHỤP MỚI\n\n👤 Khách: ${ten || "Khách Vãng Lai"}\n📞 SĐT: ${phone || "Không có"}\n📦 Gói: ${goi || "Studio"}\n💰 Giá: ${gia || 0}\n📝 Ghi chú: ${ghi_chu || "Không"}`
    );

    res.json({ success: true, message: "Đặt lịch thành công" });
  } catch (error) {
    console.error("[ORDER ERROR]", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =========================
   ADMIN LOGIN
========================= */

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "010105";
const JWT_SECRET = process.env.JWT_SECRET || "secret";

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Sai tài khoản" });
  }
});

/* =========================
   AUTH MIDDLEWARE
========================= */

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

/* =========================
   GET ORDERS (ADMIN)
========================= */

app.get("/api/orders", authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM orders ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Fetch error" });
  }
});

/* =========================
   DELETE ORDER (ADMIN)
========================= */

app.delete("/api/orders/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM orders WHERE id=?", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

/* =========================
   ROOT
========================= */

app.get("/", (req, res) => {
  res.send(`<html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f7f3ef;color:#004d20">
    <h1>🚀 Thiên Tân Studio API - Đang hoạt động!</h1>
    <a href="/admin" style="padding:10px 24px;background:#00c853;color:#fff;border-radius:20px;text-decoration:none;font-weight:bold">Vào Trang Quản Trị</a>
  </body></html>`);
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
