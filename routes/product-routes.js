const express = require("express");
const router = express.Router();
const productController = require("../controllers/product-controller");
const upload = require("../middleware/upload");
const { verifyUser, verifyAdmin } = require("../middleware/auth");

router
    .route("/")
    .get(productController.getAllProducts)
    .post(verifyUser, upload.single("productImage"), productController.createProduct)
    .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .delete(verifyAdmin, productController.deleteAllProducts);

router
    .route("/slug/:slug")
    .get(productController.getProductBySlug);

router
    .route("/:product_id")
    .get(productController.getProductById)
    .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .put(verifyUser, upload.single("productImage"), productController.updateProductById)
    .delete(verifyUser, productController.deleteProductById);


module.exports = router;
