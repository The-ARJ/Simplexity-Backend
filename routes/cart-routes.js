const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cart-controller");
const { verifyUser } = require("../middleware/auth");

router
    .route("/")
    .get(verifyUser, cartController.getCart)
    .post(verifyUser, cartController.addToCart)
    .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .delete((req, res) => res.status(501).json({ msg: "Not implemented" }));

router
    .route("/:productId")
    .get((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .put(verifyUser, cartController.updateCartProduct)
    .delete(verifyUser, cartController.removeFromCart);

router.post('/product/buy', verifyUser, cartController.buyFromCart);

module.exports = router;
