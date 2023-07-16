const mongoose = require('mongoose')

const contactchema = mongoose.Schema({

    firstName: {
        type: String,
        required: [true, 'First Name is required'],
    },
    lastName: {
        type: String,
        required: [true, 'Last Name is required'],
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
    },
}, { timestamps: true })

module.exports = mongoose.model('Contact', contactchema)