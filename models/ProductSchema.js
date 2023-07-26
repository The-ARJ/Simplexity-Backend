const mongoose = require('mongoose');

const ProductSchema = mongoose.Schema({
    name: {
        type: String,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
    },
    quantity: {
        type: Number,
    },
    category: {
        type: String,
    },
    image: {
        type: String,
    },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
    }],
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
