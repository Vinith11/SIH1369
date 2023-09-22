const mongoose = require("mongoose");

const User = require("../models/user");


//users
const user1 = new User({
    name: "Jayesh",
    email: "jayeshuramanatti@gmail.com",
    phone: 1234567890,
    password: "Jayesh2003"
});
const user2 = new User({
    name: "Amey",
    email: "ameychougule@gmail.com",
    phone: 1234567890,
    password: "Amey2002"
});
const user3 = new User({
    name: "Eshan",
    email: "eshansettannavar@gmail.com",
    phone: 1234567890,
    password: "Eshan2002"
});

module.exports = [user1, user2, user3];