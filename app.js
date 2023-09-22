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


const defaultUsers = require("./defaultItemsInDB/users");
const defaultAdmins = require("./defaultItemsInDB/admins");
const defaultItems = require("./defaultItemsInDB/items");
const defaultOrders = require("./defaultItemsInDB/orders");

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

app.get("/", function (req, res) {
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

app.get("/admin", isAuth, function (req, res) {
    Item.find({})
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

app.post("/additem", upload, function (req, res) {
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const time = req.body.time;
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

    const item = new Item({
        name: name,
        image: {
            data: imgFile.filename,
            ContentType: imgFile.mimetype
        },
        description: description,
        timeneeded: time,
        price: price,
        link: link
    });

    Item.findOne({ name: name })
        .then(function (foundItem) {
            if (!foundItem) {
                console.log("Similar item not found.");
                item.save()
                    .then(() => {
                        console.log("Item saved Successfully : " + item);
                        res.redirect("/admin");
                    })
                    .catch((error) => {
                        console.log("Error saving Item : " + error);
                    });
            } else {
                console.log("Similar item has been found and you will be redirected to additem page.");
                res.render("additem", { message: "Similar item has been found and you will be redirected to additem page." })
            }
        })
        .catch((err) => {
            console.log("Error finding similar items : " + err);
        });
});

app.post("/admin/projects/delete", function (req, res) {
    const item_id = req.body.item_id;

    console.log("Deleting : " + item_id);

    Item.findOneAndRemove({ _id: item_id })
        .then((item) => {
            fs.unlinkSync(`./public/img/${item.image.data}`);
            console.log("Successfully deleted the Item.");
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

app.get("/projects/:projectid", function (req, res) {
    const reqTitle = req.params.projectid;
    console.log(reqTitle);

    Item.findOne({ _id: reqTitle })
        .then((foundItem) => {
            // if (_.lowerCase(foundItem.name) === _.lowerCase(reqTitle)) {
            if (foundItem) {
                console.log("Project title match found.");
                res.render("project", { title: "Page not found.", message: "", item: foundItem });
            } else {
                console.log("project title match not found.");
                res.render("project", { title: "Page not found.", message: "please try again later. Try to contact a developer.Search with other parameters.", item: null });
            }
        })
        .catch((err) => {
            console.log("Error finding project by name.... : " + err);
        });

});

app.get("/admin/projects/:projectid", function (req, res) {
    const reqTitle = req.params.projectid;
    const message = req.query.message;

    // const projectObjectId = new mongoose.Types.ObjectId(reqTitle);

    Item.findOne({ _id: reqTitle })
        .then((foundItem) => {
            if (foundItem) {
                // if (_.lowerCase(foundItem.name) === _.lowerCase(reqTitle)) {
                if (foundItem) {
                    console.log("Project title match found.");
                    res.render("ediproject", { title: "Page found.", message, item: foundItem });
                    // res.render("ediproject", { title: "Page not found.", message: "", item: foundItem });
                } else {
                    console.log("project title match not found.");
                    res.render("ediproject", { title: "Page not found.", message: "please try again later. Try to contact a developer.Search with other parameters.", item: null });
                }
            } else {
                console.log("No project found.");
                res.render("ediproject", { title: "Page not found.", message: "Project not found.", item: null });
            }
        })
        .catch((err) => {
            console.log("Error finding project by name: " + err);
        });
});


app.post("/editproject", upload, function (req, res) {
    const itemID = req.body.item_id;
    const name = req.body.name;
    const description = req.body.description;
    const price = req.body.price;
    const time = req.body.time;
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

        Item.findOneAndUpdate(
            { _id: itemID },
            { $set: { name, image, description, timeneeded: time, price, link } },
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
    } else {

        console.log(name, itemID, description, price, time, link);

        Item.findOneAndUpdate(
            { _id: itemID },
            { $set: { name, description, timeneeded: time, price, link } },
            { new: true, runValidators: true } // Add these options
        )
            .then((updatedItem) => {
                console.log("Updated Item:", updatedItem);

                if (updatedItem) {
                    console.log("Item edited successfully.");
                    res.redirect("/admin/projects/" + itemID);
                } else {
                    console.log("No item found or no changes made.");
                    res.redirect("/admin/projects/" + itemID);
                }
            })
            .catch((error) => {
                console.log("Error while editing Item:", error);
                res.redirect("/admin/projects/" + itemID);
            });
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


app.listen(3000, function () {
    console.log("Server is running on port 3000");
});