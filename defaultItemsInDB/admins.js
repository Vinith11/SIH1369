const mongoose = require("mongoose");

const Admin = require("../models/admin");


//admins
const admin1 = new Admin({
    name: "Jayesh",
    password: "Jayesh2003"
});
const admin2 = new Admin({
    name: "Amey",
    password: "Amey2002"
});
const admin3 = new Admin({
    name: "Eshan",
    password: "Eshan2002"
});

module.exports = [admin1, admin2, admin3];