const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./db");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* TELEGRAM */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

async function sendTelegram(message) {
try {
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

```
await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    chat_id: TELEGRAM_CHAT_ID,
    text: message
  })
});
```

} catch (err) {
console.log("Telegram error:", err);
}
}

/* ORDER API */

app.post("/api/order", async (req, res) => {

try {

```
const { ten, phone, goi, gia, luachon, ghi_chu } = req.body;

const sql = `
  INSERT INTO orders
  (ten_khach, so_dien_thoai, goi_chup, gia, lua_chon, ghi_chu)
  VALUES (?, ?, ?, ?, ?, ?)
`;

await db.query(sql, [
  ten || "",
  phone || "",
  goi || "",
  gia || 0,
  luachon || "",
  ghi_chu || ""
]);

const message = `
```

📸 ĐƠN CHỤP MỚI

👤 Khách: ${ten}
📞 SĐT: ${phone}
📦 Gói: ${goi}
💰 Giá: ${gia}
`;

```
await sendTelegram(message);

res.json({
  success: true,
  message: "Đặt lịch thành công"
});
```

} catch (err) {

```
console.error(err);

res.status(500).json({
  success: false,
  message: "Server error"
});
```

}

});

/* START SERVER */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log("Server running on port", PORT);
});
