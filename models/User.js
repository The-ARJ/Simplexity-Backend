const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    phoneNumber: {
        type: String,
    },
    profession: {
        type: String,
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: [true, 'Email Already Exists'],
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'police'],
        default: 'user'
    },
    image: {
        type: String
    },
}, { timestamps: true })

module.exports = mongoose.model('User', userSchema)