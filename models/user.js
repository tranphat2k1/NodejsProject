const mongoose = require('mongoose')
const Schema = mongoose.Schema;

const userSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    birthdate: {
        type: Date,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    cmnd: {
        front:{
            type: String,
            required: true
        },
        back:{
            type: String,
            required: true
        }
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    admin: {
        type: Boolean,
        default: false  
    },
    status: {
        type: String,
        required: true
    },
    password_changed: {
        type: Boolean,
        default: false
    },
    login_failed: {
        type: Number,
        default: 0
    },
    disableDate:{
        type: Date
    },
    fund: {
        type: Number,
    },
    createAt:{
        type: Date,
        default: Date.now
    },
    updateAt:{
        type: Date,
    }
})

module.exports = mongoose.model('User', userSchema)
