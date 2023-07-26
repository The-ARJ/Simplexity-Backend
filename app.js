require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./routes/users-routes");
const contactRouter = require("./routes/contact-routes");
const productRouter = require("./routes/product-routes");
const reviewRouter = require("./routes/review-routes");
const cartRouter = require("./routes/cart-routes");
const bodyParser = require("body-parser");
const logger = require('./logger')
const auth = require("./middleware/auth");
const app = express();

const MONGODB_URI =
    process.env.NODE_ENV === "test"
        ? process.env.TEST_DB_URI
        : process.env.MONGODB_URI;

mongoose
    .connect(MONGODB_URI)
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        mongoose.set("strictQuery", false);
    })
    .catch((err) => console.log(err));


app.use((req, res, next) => {
    logger.log(`${req.method}\t${req.headers.origin}\t${req.path}`)
    console.log(`${req.method} ${req.path}`)
    next()
})

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/", express.static("uploads"));

app.use(express.urlencoded({ extended: false }));
// To accept json data
app.use(express.json());
// To serve static files

// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());


app.use("/users", userRouter);
app.use("/contacts", contactRouter);
app.use("/products", productRouter);
app.use("/reviews", reviewRouter);
app.use("/carts", cartRouter);
app.use(auth.verifyUser);
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.use((err, req, res, next) => {
    console.log(err.stack);
    if (res.statusCode == 200) res.status(500);
    res.json({ msg: err.message });
    next;
});
module.exports = app;
