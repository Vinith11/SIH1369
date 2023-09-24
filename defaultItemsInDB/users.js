const mongoose = require("mongoose");
const User = require("../models/user");

// Create user instances
const user1 = new User({
    name: 'Shreyas',
    usn: '2GI21IS054',
    college_id: null,
    college: 'GIT',
    grade: 'UG',
    role: "user",
    password: 'Shreyas2003'
});

const user2 = new User({
    name: "Abhilesh",
    usn: '2GI21CS002',
    college_id: null,
    college: 'GIT',
    grade: 'PG',
    role: "user",
    password: "Abhilesh2003"
});

const user3 = new User({
    name: "Gautami",
    usn: '2KL21ISO58',
    college_id: null,
    college: 'KLE',
    grade: 'UG',
    role: "user",
    password: "Gautami2003"
});

module.exports = [user1, user2, user3];
