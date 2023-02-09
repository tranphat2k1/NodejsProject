const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
require('dotenv').config()
var User = require('./models/user.js')
var CreditCard = require('./models/creditcard.js')

// connect database
mongoose.connect(process.env.DB_CONNECT, (err) => {
    if (!err) console.log('DB connect successfully')
    else console.log('DB connect failed')
})

//create admin account
bcrypt.hash('123456', 10, (err, hash) =>{
  let user = new User({
    fullname: 'admin',
    email: 'admin@gmail.com',
    phone: '0987654321',
    birthdate: '10/10/2001',
    address: '551/3 Hương lộ 2, Bình Trị Đông, Bình Tân, HCM',
    cmnd: {
      front: 'image1.png',
      back: 'image2.png',
    },
    username: 'admin',
    password: hash,
    password_changed: true,
    admin: true,
    status: 'admin',
    fund: 0,
  }).save()
})

//create creditcard
let creditCard = new CreditCard({
    cardNumber: '111111',
    expirationDate: '10/10/2022',
    CVV: '411'
}).save()

let creditCard2 = new CreditCard({
    cardNumber: '222222',
    expirationDate: '11/11/2022',
    CVV: '443'
}).save()

let creditCard3 = new CreditCard({
    cardNumber: '333333',
    expirationDate:'12/12/2022',
    CVV: '577'
}).save()