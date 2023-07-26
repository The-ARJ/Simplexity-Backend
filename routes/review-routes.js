const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/review-controller");
const { verifyUser } = require("../middleware/auth");

router
    .route("/")
    .get(reviewController.getAllReviews)
    .post(verifyUser, reviewController.createReview)
    .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .delete((req, res) => res.status(501).json({ msg: "Not implemented" }));

router
    .route("/:review_id")
    .get(reviewController.getReviewById)
    .post((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .put((req, res) => res.status(501).json({ msg: "Not implemented" }))
    .delete(verifyUser, reviewController.deleteReviewById);
// New route for fetching reviews by a specific product ID
router.get("/product/:product_id", reviewController.getReviewsByProduct);

module.exports = router;
