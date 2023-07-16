const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contact-controller");
const upload = require("../middleware/upload");

const {
    verifySuperAdmin,
    verifyAdmin,
} = require("../middleware/auth");

router
    .route("/")
    .get(verifyAdmin, contactController.getAllContacts)
    .post(upload.single("contactImage"), contactController.createContact)
    .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .delete(verifySuperAdmin, contactController.deleteAllContacts);


module.exports = router;
