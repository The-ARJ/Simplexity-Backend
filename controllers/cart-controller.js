const Cart = require("../models/CartSchema");

const getCart = (req, res, next) => {
    Cart.findOne({ user: req.user.id })
        .populate('products.product')
        .then((cart) => {
            res.status(200).json({
                success: true,
                message: "Cart retrieved successfully",
                data: cart,
            });
        })
        .catch((error) => {
            res.status(500).json({
                success: false,
                message: "Error retrieving cart",
                error,
            });
        });
};

const addToCart = (req, res, next) => {
    Cart.findOne({ user: req.user.id })
        .then((cart) => {
            if (!cart) {
                cart = new Cart({ user: req.user.id });
            }

            const productIndex = cart.products.findIndex(p => p.product.toString() === req.body.productId);
            if (productIndex > -1) {
                // Product exists in the cart, increase quantity
                const productItem = cart.products[productIndex];
                productItem.quantity += req.body.quantity;
            } else {
                // Product not in cart, add new product
                cart.products.push({
                    product: req.body.productId,
                    quantity: req.body.quantity,
                });
            }

            return cart.save();
        })
        .then((updatedCart) => {
            res.status(201).json({
                message: "Product added to cart successfully",
                cart: updatedCart,
            });
        })
        .catch((error) => {
            res.status(500).json({
                message: "Error adding product to cart",
                error: error.message,
            });
        });
};

const updateCartProduct = (req, res, next) => {
    Cart.findOne({ user: req.user.id })
        .then((cart) => {
            const productItem = cart.products.find(
                (p) => p.product.toString() === req.params.productId
            );
            if (!productItem) {
                return res.status(404).json({ error: "Product not found in cart" });
            }

            productItem.quantity = req.body.quantity;

            return cart.save();
        })
        .then((updatedCart) => {
            res.json({
                success: true,
                message: "Cart updated successfully",
                data: updatedCart,
            });
        })
        .catch((err) => {
            return res.status(500).json({ error: "Server Error" });
        });
};


const removeFromCart = (req, res, next) => {
    Cart.findOne({ user: req.user.id })
        .then((cart) => {
            const productIndex = cart.products.findIndex(p => p.product.toString() === req.params.productId);
            if (productIndex > -1) {
                cart.products.splice(productIndex, 1);
                return cart.save();
            } else {
                return res.status(404).json({ message: "Product not found in cart" });
            }
        })
        .then((updatedCart) => {
            res.json({ message: "Product removed from cart successfully", data: updatedCart });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error removing product from cart", error });
        });
};

const buyFromCart = (req, res, next) => {
    Cart.findOne({ user: req.user.id })
        .populate('products.product')
        .then((cart) => {
            if (!cart) {
                return res.status(404).json({ error: "Cart not found" });
            }

            // Mark products as bought and update their quantity
            cart.products.forEach((cartItem) => {
                const product = cartItem.product;
                if (product.quantity >= cartItem.quantity) {
                    product.quantity -= cartItem.quantity;
                    product.isBought = true;
                    product.boughtBy = req.user.id; // Set the user ID who bought the product
                } else {
                    return res.status(400).json({ error: "Insufficient product quantity" });
                }
            });

            // Save the updated products
            const productUpdates = cart.products.map((cartItem) => cartItem.product.save());

            // Clear the cart
            cart.products = [];
            cart.totalAmount = 0;

            // Save the cart and wait for all product updates to complete
            return Promise.all([cart.save(), ...productUpdates]);
        })
        .then(([cart, ...updatedProducts]) => {
            res.json({ message: "Purchase successful", data: cart });
        })
        .catch((error) => {
            res.status(500).json({ message: "Error processing purchase", error });
        });
};



module.exports = {
    getCart,
    addToCart,
    updateCartProduct,
    removeFromCart,
    buyFromCart
};
