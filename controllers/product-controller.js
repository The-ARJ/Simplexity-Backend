const Product = require("../models/ProductSchema");

const getAllProducts = (req, res, next) => {
  Product.find({})
    .then((products) => {
      res.status(200).json({
        success: true,
        message: "Products retrieved successfully",
        data: products,
      });
    })
    .catch((error) => {
      res.status(500).json({
        success: false,
        message: "Error retrieving products",
        error,
      });
    });
};

const createProduct = (req, res, next) => {
  let product = {
    ...req.body,
    owner: req.user.id,
  };

  if (req.file) {
    product.image = "/product_images/" + req.file.filename;
  }

  Product.create(product)
    .then((createdProduct) => {
      res.status(201).json({
        message: "Product created successfully",
        product: createdProduct,
      });
    })
    .catch((error) => {
      console.log(error)
      res.status(500).json({
        message: "Error creating product",
        error: error.message,
      });
    });
};
const updateProductById = (req, res, next) => {
  Product.findById(req.params.product_id)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      product.name = req.body.name || product.name;
      product.description = req.body.description || product.description;
      product.price = req.body.price || product.price;
      product.quantity = req.body.quantity || product.quantity;
      product.category = req.body.category || product.category;

      if (req.file) {
        product.image = "/product_images/" + req.file.filename;
      }

      product
        .save()
        .then((updatedProduct) => {
          const data = {
            id: updatedProduct._id,
            name: updatedProduct.name,
            description: updatedProduct.description,
            price: updatedProduct.price,
            quantity: updatedProduct.quantity,
            category: updatedProduct.category,
            image: updatedProduct.image,
          };
          return res.json({
            success: true,
            message: "Product updated successfully",
            data,
          });
        })
        .catch((err) => {
          return res.status(400).json({ error: "Error updating product" });
        });
    })
    .catch((err) => {
      return res.status(500).json({ error: "Server Error" });
    });
};


const deleteAllProducts = (req, res, next) => {
  Product.deleteMany()
    .then(() => {
      res.status(200).json({ message: "All products deleted successfully" });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error deleting all products", error });
    });
};

const getProductById = (req, res, next) => {
  Product.findById(req.params.product_id)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({
        success: true,
        message: "Product retrieved successfully",
        data: product,
      });
    })
    .catch((error) => {
      res.status(500).json({ message: "Error retrieving product", error });
    });
};


const deleteProductById = (req, res, next) => {
  const productId = req.params.product_id;
  console.log("delete", productId)
  Product.findByIdAndDelete(productId)
    .then((product) => {
      if (product) {
        res.json({ message: "Product deleted successfully" });
      } else {
        res.status(404).json({ message: "Product not found" });
      }
    })
    .catch((error) => {
      res.status(500).json({ message: "Error deleting product", error });
    });
};

module.exports = {
  getAllProducts,
  createProduct,
  deleteAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
};
