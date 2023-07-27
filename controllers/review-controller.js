const Review = require("../models/ReviewSchema");
const Product = require("../models/ProductSchema");

const getAllReviews = (req, res, next) => {
    Review.find({})
        .populate('user', 'firstName lastName email image')
        .populate('product', 'name')
        .then((reviews) => {
            res.status(200).json({
                success: true,
                message: "Reviews retrieved successfully",
                data: reviews,
            });
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                message: "Error retrieving reviews",
                error,
            });
        });
};
const getReviewsByProduct = (req, res, next) => {
    const productId = req.params.product_id; // Assuming you pass the product ID in the URL

    Review.find({ product: productId })
        .populate("user", "firstName lastName email image isVerified isOnline")
        .populate("product", "name")
        .then((reviews) => {
            res.status(200).json({
                success: true,
                message: "Reviews retrieved successfully",
                data: reviews,
            });
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                message: "Error retrieving reviews",
                error,
            });
        });
};
const createReview = (req, res, next) => {
    let review = {
        ...req.body,
        user: req.user.id,
    };

    console.log("Review Data:", review);

    Review.create(review)
        .then((createdReview) => {
            console.log("Created Review:", createdReview);

            // Also add this review to the product's reviews
            return Product.findByIdAndUpdate(
                review.product,
                { $push: { reviews: createdReview._id } },
                { new: true }
            ).then(() => {
                console.log("Product Updated");
                res.status(201).json({
                    message: "Review created successfully",
                    review: createdReview,
                });
            });
        })
        .catch((error) => {
            console.log("Error:", error);
            res.status(500).json({
                message: "Error creating review",
                error: error.message,
            });
        });
};


const getReviewById = (req, res, next) => {
    Review.findById(req.params.review_id)
        .populate('user', 'firstName lastName email')
        .populate('product', 'name')
        .then((review) => {
            if (!review) {
                return res.status(404).json({ message: "Review not found" });
            }
            res.json({
                success: true,
                message: "Review retrieved successfully",
                data: review,
            });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error retrieving review", error });
        });
};

const deleteReviewById = (req, res, next) => {
    const reviewId = req.params.review_id;

    Review.findByIdAndDelete(reviewId)
        .then((review) => {
            if (review) {
                // Also remove this review from the product's reviews
                return Product.findByIdAndUpdate(
                    review.product,
                    { $pull: { reviews: review._id } },
                    { new: true }
                ).then(() => {
                    res.json({ message: "Review deleted successfully" });
                });
            } else {
                res.status(404).json({ message: "Review not found" });
            }
        })
        .catch((error) => {
            res.status(500).json({ message: "Error deleting review", error });
        });
};

module.exports = {
    getAllReviews,
    createReview,
    getReviewById,
    deleteReviewById,
    getReviewsByProduct
};
