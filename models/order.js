const mongoose = require("mongoose");

const Item = require("./item");

const orderSchema = new mongoose.Schema({
    item_id: { type: mongoose.Schema.Types.ObjectId, ref: "item", required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
    nearby: { type: Boolean, required: true },
}, { timestamps: true });

module.exports = mongoose.model("order", orderSchema);