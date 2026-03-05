const express = require('express')
const cors = require('cors')
const path = require('path')
const db = require('./db')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const app = express()

/* TELEGRAM */

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function sendTelegram(msg){
try{
const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`

```
await fetch(url,{
  method:'POST',
  headers:{'Content-Type':'application/json'},
  body:JSON.stringify({
    chat_id:TELEGRAM_CHAT_ID,
    text:msg
  })
})
```

}catch(e){
console.log('Telegram error',e)
}
}

/* MIDDLEWARE */

app.use(cors({origin:'*'}))
app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use('/admin',express.static(path.join(__dirname,'admin')))

/* ORDER */

app.post('/api/order',async(req,res)=>{

try{

```
const {ten,phone,goi,gia,luachon,ghi_chu} = req.body

const sql = `
INSERT INTO orders (ten_khach, so_dien_thoai, goi_chup, gia, lua_chon, ghi_chu)
VALUES (?, ?, ?, ?, ?, ?)
`

await db.query(sql,[
  ten || 'Khách Vãng Lai',
  phone || '',
  goi || 'Studio',
  gia || 0,
  luachon || '',
  ghi_chu || ''
])

const msg =
```

`📸 ĐƠN CHỤP MỚI

Khách: ${ten}
SĐT: ${phone}
Gói: ${goi}
Giá: ${gia}
`

```
await sendTelegram(msg)

res.json({
  success:true,
  message:'Đặt lịch thành công'
})
```

}catch(err){

```
console.error(err)

res.status(500).json({
  success:false,
  message:'Server error'
})
```

}

})

/* LOGIN */

const ADMIN_USER = process.env.ADMIN_USER || 'admin'
const ADMIN_PASS = process.env.ADMIN_PASS || '010105'
const JWT_SECRET = process.env.JWT_SECRET || 'secret'

app.post('/api/login',(req,res)=>{

const {username,password} = req.body

if(username===ADMIN_USER && password===ADMIN_PASS){

```
const token = jwt.sign({role:'admin'},JWT_SECRET,{expiresIn:'1d'})

res.json({success:true,token})
```

}else{
res.status(401).json({success:false})
}

})

/* AUTH */

function authenticateToken(req,res,next){

const authHeader=req.headers['authorization']
const token=authHeader && authHeader.split(' ')[1]

if(!token) return res.sendStatus(401)

jwt.verify(token,JWT_SECRET,(err,user)=>{

```
if(err) return res.sendStatus(403)

req.user=user
next()
```

})

}

/* GET ORDERS */

app.get('/api/orders',authenticateToken,async(req,res)=>{

const [rows] = await db.query(
'SELECT * FROM orders ORDER BY created_at DESC'
)

res.json(rows)

})

/* DELETE */

app.delete('/api/orders/:id',authenticateToken,async(req,res)=>{

const {id}=req.params

await db.query(
'DELETE FROM orders WHERE id=?',
[id]
)

res.json({success:true})

})

/* START */

const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
console.log('Server running on port '+PORT)
})
