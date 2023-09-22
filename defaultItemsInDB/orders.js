const mongoose = require("mongoose");

const Order = require("../models/order");

//items
const order1 = new Order({
    item: null,
    name: 'Rachana Uramanatti',
    phone: '1325566',
    city: 'Belgaum',
    zip: '12314',
    nearby: true,
});

module.exports = [order1];