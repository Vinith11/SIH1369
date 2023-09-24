const mongoose = require("mongoose");

const Admin = require("../models/admin");


//admins
const admin1 = new Admin({
    name: "GIT",
    role: "admin",
    password: "KLSGIT"
});
const admin2 = new Admin({
    name: "KLE",
    role: "admin",    
    password: "KLE"
});

module.exports = [admin1, admin2];