const mongoose = require("mongoose");
const Admin = require("./admin");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    usn: { type: String, required: true },
    college_id: { type: mongoose.Schema.Types.ObjectId, ref: "admin", required: true },
    college: {type: String, required:true},
    grade: {type: String, required:true},
    role: { type: String, required: true },
    password: { type: String, required: true }
});

module.exports = mongoose.model("user", userSchema);