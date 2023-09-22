const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        data: {
            type: Buffer,
            required: true
        },
        ContentType: {
            type: String,
            required: true
        },
    },
    description: {
        type: String,
        required: true
    },
    timeneeded: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    link: String
});

module.exports = mongoose.model("item", itemSchema);