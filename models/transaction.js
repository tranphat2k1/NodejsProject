const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    maker: {
        type: String,
        required: true
    },
    sender:{
        type: String,
    },
    receiver: {
        type: String,
    },
    type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    network: {
        type: String,
    },
    price: {
        type: Number,
    },
    count: {
        type: Number,
    },
    cardID: [],
    fee: {
        type: Number,
        default: 0
    },
    feePayer: {
        type: String,
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        required: true
    },
    note: {
        type: String,
    }
})

module.exports = mongoose.model('Transaction', transactionSchema)