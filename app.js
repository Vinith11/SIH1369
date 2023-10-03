require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");
const session = require("express-session");
var MongoDBSession = require('connect-mongodb-session')(session);
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use('/css', express.static("public/css"));

const User = require("./models/user");
const Admin = require("./models/admin");
const Item = require("./models/item");
const Order = require("./models/order");
const Collab = require("./models/collab");


const defaultUsers = require("./defaultItemsInDB/users");
const defaultAdmins = require("./defaultItemsInDB/admins");
const defaultItems = require("./defaultItemsInDB/items");
const defaultOrders = require("./defaultItemsInDB/orders");
const items = require("./defaultItemsInDB/items");
const collab = require("./models/collab");

// const MongoURI = 'mongodb://127.0.0.1:27017/techsolution';
const MongoURI = process.env.MONGO_URI;

mongoose
    .connect(MongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => {
        console.log('Connected to MongoDB');
        // Continue with the rest of the code here
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

//set storage for images
const dir = "./public/img";

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir);
            }
            cb(null, dir); // Use the defined directory
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname)
        },
    }),

    fileFilter: (req, file, cb) => {
        let ext = path.extname(file.originalname);
        if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return cb(null, false);
        }
        cb(null, true);
    }
}).single('imgfile');

const store = new MongoDBSession({
    uri: MongoURI,
    collection: "mySessions",
});

//sessions
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    cookie: {
        maxAge: 10800000, // 3 hour in milliseconds
        sameSite: 'strict'
    },
}));

const isAuth = (req, res, next) => {
    if (req.session.isAuth) {
        next();
    } else {
        res.redirect("/");
    }
}


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something went wrong!');
});

function insertDefaultAdmins() {
    // insertMany admins
    Admin.insertMany(defaultAdmins)
        .then(() => {
            console.log("Successfully inserted admin objects.");
        })
        .catch((error) => {
            console.log("Error inserting array of admin objects : " + error);
        });
}

app.get("/", function (req, res) {
    console.log('hello');
    res.render('loginSelect')
});

app.get("/alogin", function (req, res) {
    Admin.find({})
        .then(function (adminList) {
            if (adminList.length === 0) {
                insertDefaultAdmins();
                res.redirect("/admin");
            } else {
                console.log(adminList[0]);
                res.render("alogin", { message: "" });
            }
        })
        .catch((error) => {
            console.log("Error finding admins: " + error);
        });
});

app.post("/alogin", function (req, res) {
    const uname = req.body.name;
    const password = req.body.password;

    Admin.findOne({ name: uname })
        .then(function (foundAdmin) {
            if (!foundAdmin) {
                console.log("Admin not found");
                res.render("alogin", { message: "Wrong username or password" });
            } else {
                console.log("Found admin");
                if (foundAdmin.password == password) {
                    console.log("Admin varified");
                    req.session.isAuth = true;
                    req.session.user = foundAdmin;
                    res.redirect("/admin");
                }
                else {
                    // console.log("wrong password : " + password);
                    res.render("alogin", { message: "Wrong username or password" });
                }
            }
        })
        .catch((err) => {
            console.log("Error finding admin by name : " + err);
        });

});

function insertDefaultUsers() {
    // insertMany admins
    for (let user in defaultUsers) {
        console.log(defaultUsers[user]);
        if (defaultUsers[user].college_id === null) {
            const college = defaultUsers[user].college;
            Admin.findOne({ name: college })
                .then((foundCollege) => {
                    defaultUsers[user].college_id = foundCollege._id;
                    console.log("assigned college id to user");
                })
                .catch((err) => {
                    console.log("Error assigning college id : ", err);
                })
        }
    }

    // console.log(defaultUsers);

    User.insertMany(defaultUsers)
        .then(() => {
            console.log("Successfully inserted user objects.");
        })
        .catch((error) => {
            console.log("Error inserting array of user objects : " + error);
        });
}

app.get("/slogin", function (req, res) {
    User.find({})
        .then(function (userList) {
            if (userList.length === 0) {
                insertDefaultUsers();
                res.redirect("/slogin");
            } else {
                console.log(userList[0]);
                res.render("slogin", { message: "" });
            }
        })
        .catch((error) => {
            console.log("Error finding admins: " + error);
        });
});

app.post("/slogin", function (req, res) {
    const uname = req.body.name;
    const password = req.body.password;

    User.findOne({ name: uname })
        .then(function (foundUser) {
            if (!foundUser) {
                console.log("user not found");
                res.render("slogin", { message: "Wrong username or password" });
            } else {
                console.log("Found user");
                if (foundUser.password == password) {
                    console.log("student varified");
                    req.session.isAuth = true;
                    req.session.user = foundUser;
                    res.redirect("/home");
                }
                else {
                    // console.log("wrong password : " + password);
                    res.render("slogin", { message: "Wrong username or password" });
                }
            }
        })
        .catch((err) => {
            console.log("Error finding user by name : " + err);
        });

});

app.get("/home", isAuth, function (req, res) {
    Item.find({})
        .then(function (itemList) {
            if (itemList.length === 0) {
                console.log("No items found");
                res.render("home", { itemList });
            } else {
                res.render("home", { itemList });
            }
        })
        .catch((error) => {
            console.log("Error finding item : " + error);
        });
});

app.get("/admin", isAuth, function (req, res) {

    if (req.session.user.role != 'admin') {
        // It's not an Admin
        console.log("Unknown user type is logged in");
        console.log(req.session.user);
        res.redirect('/');
    }

    // console.log(req.session.user);

    Item.find({ college: req.session.user.name})
        .then(function (itemList) {
            Order.find({})
                .then((orderList) => {
                    res.render("admin", { itemList, orderList });
                })
                .catch((err) => {
                    console.log("error finding orderList : " + err);
                });
        })
        .catch((error) => {
            console.log("Error finding item : " + error);
        });
});

app.get("/additem", isAuth, function (req, res) {
    res.render("additem", { message: "Add new item details." });
});

function addCollab(item, usn) {
    User.findOne({ usn: usn })
        .then((foundUser) => {
            if (!foundUser) {
                console.log("No user found for collab");
            } else {
                Item.findOne({ name: item.name })
                    .then((foundItem) => {
                        const collab = new Collab({
                            student_id: foundUser._id,
                            item_id: foundItem._id
                        });
                        collab.save()
                            .then(() => {
                                console.log("Collab with item saved successfully");
                            })
                            .catch((err) => {
                                console.log("Error creating a collab with item", err);
                            });
                    })
                    .catch((err) => {
                        console.log("Error finding item details for collab ", err);
                    });
            }
        })
        .catch((err) => {
            console.log("Error finding user for collab, ", err);
        })
}

app.post("/additem", upload, function (req, res) {
    const name = req.body.name;
    const description = req.body.description;
    // const price = req.body.price;
    // const time = req.body.time;
    const subject = req.body.subject;
    const studentUSN = req.body.student;
    const college = req.body.college;
    const imgFile = req.file;
    let link = req.body.link;

    if (link.length == 0) {
        link = null;
    }

    // Check if a file was uploaded
    if (!imgFile) {
        console.log("No image file was uploaded.");
        res.redirect("/admin");
        return;
    }

    Admin.findOne({ name: college })
        .then((foundCollege) => {
            const item = new Item({
                name: name,
                image: {
                    data: imgFile.filename,
                    ContentType: imgFile.mimetype
                },
                description: description,
                college: college,
                // price: price,
                subject: subject,
                college_id: foundCollege._id,
                link: link
            });

            console.log("College_id assigned to project");

            Item.findOne({ name: name })
                .then(function (foundItem) {
                    if (!foundItem) {
                        console.log("Similar item not found.");
                        console.log(item);
                        item.save()
                            .then(() => {
                                console.log("Item saved Successfully : " + item);
                                res.redirect("/admin");
                            })
                            .catch((error) => {
                                console.log("Error saving Item : " + error);
                            });

                        addCollab(item, studentUSN)
                            .then(() => {
                                console.log("Collaboration complete.");
                            })
                            .catch((err) => {
                                console.log("Error creating collaboration, ", err);
                            });
                    } else {
                        console.log("Similar item has been found and you will be redirected to additem page.");
                        res.render("additem", { message: "Similar item has been found and you will be redirected to additem page." })
                    }
                })
                .catch((err) => {
                    console.log("Error finding similar items : " + err);
                });
        })
        .catch((err) => {
            console.log("Error assigning college_id to projects.", err);
        })

});

app.post("/admin/projects/delete", function (req, res) {
    const item_id = req.body.item_id;

    console.log("Deleting : " + item_id);

    Item.findOneAndRemove({ _id: item_id })
        .then((item) => {
            fs.unlinkSync(`./public/img/${item.image.data}`);
            console.log("Successfully deleted the Item.");

            Collab.deleteMany({ item_id })
                .then((collabs) => {
                    for(let collab of collabs){
                        console.log('Deleted : ', collab._id);
                    }
                    console.log("Successfully deleted collabs after deleting items.");
                })
                .catch((err) => {
                    console.log('Error deleting collab items after deleting items.');
                });
        })
        .catch((err) => {
            console.log("Error deleting Item : " + err);
        });

    res.redirect('/admin');
});

app.post("/alogout", function (req, res) {
    req.session.isAuth = false;

    //need to add session deletion.






    res.redirect("/alogin");
});

app.get("/projects/:projectid", async function (req, res) {
    const reqTitle = req.params.projectid;
    // const message = req.query.message;
    let collabMembers = [];

    try {
        // Find the project by ID, populate the members
        const foundItem = await Item.findById(reqTitle);

        if (!foundItem || foundItem.length === 0) {
            console.log("Project title match not found.");
            res.render("project", { title: "items not found.", message: "Please try again later. Try to contact a developer. Search with other parameters.", item: null });
        }

        try {
            const foundCollabs = await Collab.find({ item_id: foundItem._id });

            if (!foundCollabs || foundCollabs.length === 0) {
                console.log("Project collab members not found.");
                res.render("project", { title: "collab members not found.", message: "Please try again later. Try to contact a developer. Search with other parameters.", item: null });
            }

            for (let collab of foundCollabs) {
                const foundMembers = await User.find({ _id: collab.student_id });

                if (!foundMembers || foundMembers.length === 0) {
                    console.log("No users found for collaboration: " + grade);
                    continue;
                }

                collabMembers.push(...foundMembers);
            }

            if (collabMembers.length > 0) {
                console.log("collab members is ready");
                res.render("project", { title: "collab members not found.", message: "", item: foundItem, members: collabMembers });
            } else {
                console.log("No collab members found for the given project and collaborations.");
                return res.redirect('/home');
            }

        } catch (err) {
            console.log("Error finding collab members by proj ID: " + err);
            res.status(500).send("Internal Server Error");
        }

    } catch (err) {
        console.log("Error finding project by ID: " + err);
        res.status(500).send("Internal Server Error");
    }
});

app.get("/admin/projects/:projectid", async function (req, res) {
    const reqTitle = req.params.projectid;
    // const message = req.query.message;
    let collabMembers = [];

    try {
        // Find the project by ID, populate the members
        const foundItem = await Item.findById(reqTitle);

        if (!foundItem || foundItem.length === 0) {
            console.log("Project title match not found.");
            res.render("ediproject", { title: "items not found.", message: "Please try again later. Try to contact a developer. Search with other parameters.", item: null });
        }

        try {
            const foundCollabs = await Collab.find({ item_id: foundItem._id });

            if (!foundCollabs || foundCollabs.length === 0) {
                console.log("Project collab members not found.");
                res.render("ediproject", { title: "collab members not found.", message: "Please try again later. Try to contact a developer. Search with other parameters.", item: null });
            }

            for (let collab of foundCollabs) {
                const foundMembers = await User.find({ _id: collab.student_id });

                if (!foundMembers || foundMembers.length === 0) {
                    console.log("No users found for collaboration: " + grade);
                    continue;
                }

                collabMembers.push(...foundMembers);
            }

            if (collabMembers.length > 0) {
                console.log("collab members is ready");
                res.render("ediproject", { title: "collab members not found.", message: "", item: foundItem, members: collabMembers });
            } else {
                console.log("No collab members found for the given project and collaborations.");
                return res.redirect('/admin');
            }

        } catch (err) {
            console.log("Error finding collab members by proj ID: " + err);
            res.status(500).send("Internal Server Error");
        }

    } catch (err) {
        console.log("Error finding project by ID: " + err);
        res.status(500).send("Internal Server Error");
    }
});

app.post("/addcollaborator", function (req, res) {
    const itemID = req.body.item_id;
    const collabusn = req.body.collabusn;

    Item.findOne({ _id: itemID })
        .then((foundItem) => {
            if (!foundItem) {
                console.log("Item not found for addcollab.");
            } else {
                console.log("item found for addcollab.");
                console.log(foundItem, collabusn);
                addCollab(foundItem, collabusn);
            }
        })
        .catch((err) => {
            console.log("Error finding item for addCollab. ", err);
        });

    res.redirect('/admin/projects/' + itemID);
});

app.post('/deletecollaborator', function (req, res) {
    const collabID = req.body.collab_id;
    const itemID = req.body.item_id;

    console.log(collabID, itemID);

    Collab.deleteOne({ student_id: collabID, item_id: itemID })
        .then(() => {
            console.log("Collaboration Deleted.");
        })
        .catch((err) => {
            console.log("Error deleting collaboration.", err);
        });

    res.redirect("/admin/projects/" + itemID);
});

app.post("/editproject", upload, function (req, res) {
    const itemID = req.body.item_id;
    const name = req.body.name;
    const description = req.body.description;
    const subject = req.body.subject;
    const college = req.body.college;
    let link = req.body.link;

    const imgFile = req.file;

    if (!imgFile) {
        console.log("No image file was uploaded.");
    }

    if (imgFile) {
        console.log("image file being uploaded.");

        Item.findOne({ _id: itemID })
            .then((item) => {
                fs.unlinkSync(`./public/img/${item.image.data}`);
                console.log("Successfully deleted the image of Item.");
            })
            .catch((err) => {
                console.log("Error deleting image of the Item : " + err);
            });

        const image = {
            data: imgFile.filename,
            ContentType: imgFile.mimetype
        }

        console.log(image.data, image.ContentType);

        Admin.findOne({ name: college })
            .then((foundCollege) => {
                if (!foundCollege) {
                    console.log("No college found for editing name.");
                    res.redirect("/admin");
                } else {
                    console.log("college found.");
                    ;
                    Item.findOneAndUpdate(
                        { _id: itemID },
                        { $set: { name, image, description, subject, college, college_id: foundCollege._id, link } },
                        { new: true, runValidators: true } // Add these options
                    )
                        .then((updatedItem) => {
                            console.log("Updated Item with image:", updatedItem);

                            if (updatedItem) {
                                console.log("Item edited with image successfully.");
                                res.redirect("/admin/projects/" + itemID);
                            } else {
                                console.log("No item found or no changes made with img.");
                                res.redirect("/admin/projects/" + itemID);
                            }
                        })
                        .catch((error) => {
                            console.log("Error while editing Item with image:", error);
                            res.redirect("/admin/projects/" + itemID);
                        });
                }
            })

    } else {

        console.log(name, itemID, description, subject, college, link);

        Admin.findOne({ name: college })
            .then((foundCollege) => {
                if (!foundCollege) {
                    console.log("No college found for editing name.");
                    res.redirect("/admin");
                } else {
                    console.log("college found.");
                    ;
                    Item.findOneAndUpdate(
                        { _id: itemID },
                        { $set: { name, description, subject, college, college_id: foundCollege._id, link } },
                        { new: true, runValidators: true } // Add these options
                    )
                        .then((updatedItem) => {
                            console.log("Updated Item with image:", updatedItem);

                            if (updatedItem) {
                                console.log("Item edited with image successfully.");
                                res.redirect("/admin/projects/" + itemID);
                            } else {
                                console.log("No item found or no changes made with img.");
                                res.redirect("/admin/projects/" + itemID);
                            }
                        })
                        .catch((error) => {
                            console.log("Error while editing Item with image:", error);
                            res.redirect("/admin/projects/" + itemID);
                        });
                }
            })
    }

});

app.get("/admin/orders", function (req, res) {
    Order.find({})
        .populate("item_id")
        .then((foundOrders) => {
            if (!foundOrders || foundOrders.length === 0) { // Check if the array is empty
                console.log("There are no orders.");
                res.render("orders", { orderList: foundOrders, message: "No orders available." });
            } else {
                console.log("Orders found.");
                res.render("orders", { orderList: foundOrders, message: "" });
            }
        })
        .catch((err) => {
            console.log("Error finding orders:", err);
        });
});

app.post("/admin/orders/delete", function (req, res) {
    const order_id = req.body.order_id;

    console.log("Deleting : " + order_id);

    Order.deleteOne({ _id: order_id })
        .then(() => {
            console.log("Successfully deleted the order.");
        })
        .catch((err) => {
            console.log("Error deleting order : " + err);
        });

    res.redirect('/admin/orders');
});

app.post("/projects/contact", function (req, res) {
    const itemID = req.body.itemID;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const phone = req.body.phone;
    const city = req.body.city;
    const zip = req.body.zip;
    const nearby = req.body.nearby;

    const fullName = fname + " " + lname;

    if (nearby.length == 0) {
        nearby = "false";
    }

    const newOrder = new Order({
        item_id: itemID,
        name: fullName,
        phone: phone,
        city: city,
        zip: zip,
        nearby: nearby
    });

    Order.findOne({ name: fullName, item_id: itemID })
        .then(function (foundOrder) {
            if (!foundOrder) {
                // console.log("Similar order not found.");
                newOrder.save()
                    .then(() => {
                        console.log("New order saved Successfully : " + newOrder);
                        res.redirect("/");
                    })
                    .catch((error) => {
                        console.log("Error saving new Order : " + error);
                    });
            } else {
                console.log("Similar order has been found and you will be redirected to additem page.");
                res.send("You have already placed order and contacted the Seller, They will contact you in a while. Please be patient.")
            }
        })
        .catch((err) => {
            console.log("Error finding similar items : " + err);
        });


});

app.post('/grade', async function (req, res) {
    const grade = req.body.grade;

    let proj = [];

    try {
        const foundUsers = await User.find({ grade: grade });

        if (!foundUsers || foundUsers.length === 0) {
            console.log("No users found with this grade.");
            return res.render('home', { itemList: proj });
        }

        for (let user of foundUsers) {
            const foundCollabs = await Collab.find({ student_id: user._id });

            if (!foundCollabs || foundCollabs.length === 0) {
                console.log("No collaborations found for user with grade: " + grade);
                continue;
            }

            for (let collab of foundCollabs) {
                const foundItems = await Item.find({ _id: collab.item_id });

                if (!foundItems || foundItems.length === 0) {
                    console.log("No items found for collaboration: " + collab._id);
                    continue;
                }

                proj.push(...foundItems);
            }
        }

        if (proj.length > 0) {
            console.log("proj is ready");
            return res.render('home', { itemList: proj });
        } else {
            console.log("No projects found for the given grade and collaborations.");
            return res.render('home', { itemList: proj });
        }
    } catch (error) {
        console.log("Error in /grade route:", error);
        return res.status(500).send("Internal Server Error");
    }
});

app.post('/subject', function (req, res) {
    const subject = req.body.subject;

    Item.find({ subject })
        .then((foundItems) => {
            if (!foundItems) {
                console.log("Items not found while searching with subs");
            } else {
                console.log(foundItems);
                res.render('home', { itemList: foundItems });
            }
        })
})

app.post('/college', function (req, res) {
    const college = req.body.college;

    Item.find({ college })
        .then((foundItems) => {
            if (!foundItems) {
                console.log("Items not found while searching with subs");
            } else {
                console.log(foundItems);
                res.render('home', { itemList: foundItems });
            }
        })
});

// app.post('/usn', function(req, res){

// });

app.listen(3000, function () {
    console.log("Server is running on port 3000");
});