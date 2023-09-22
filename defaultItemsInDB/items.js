const mongoose = require("mongoose");

const Item = require("../models/item");

//items
const item1 = new Item({
    name: "Robot",
    description: "This is operated by Rasbery pie",
    timeneeded: "10 days",
    price: 50000
});

module.exports = [item1];