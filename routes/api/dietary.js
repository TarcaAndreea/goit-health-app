const express = require("express");
const router = express.Router();
const { auth } = require("../../middelwares/auth");
const multer = require("multer");
const path = require("path");
const {
  getProducts,
  getAllProductsByQuery,
  getMyProducts,
  getDailyRateController,
  getDailyRateUserController,
  deleteMyProducts,
  addMyProducts,
} = require("../../controllers/dietary");

router.get("/products", getProducts);
router.get("/products/searchProducts", getAllProductsByQuery);
router.post("/products", getDailyRateController);
router.post("/products/:userId", auth, getDailyRateUserController);

router.post("/myproducts/addProduct", addMyProducts);
router.delete("/myproducts/:productId", deleteMyProducts);
router.post("/myproducts/listMyProduct", getMyProducts);
