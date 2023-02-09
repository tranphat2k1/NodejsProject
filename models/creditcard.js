const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const creditcardSchema = new Schema({
    cardNumber:{
        type: String,
        required: true
    },
    expirationDate:{
        type: Date,
        required: true
    },
    CVV:{
        type: String,
        required: true
    },
})

module.exports = mongoose.model('CreditCard', creditcardSchema)
