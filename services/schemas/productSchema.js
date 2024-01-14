const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const product = new Schema({
  categories: [{ type: String }],
  weight: {
    type: Number,
    required: true,
  },
  title: { type: String, required: true },

  calories: {
    type: Number,
    required: true,
  },
  groupBloodNotAllowed: {
    1: { type: Boolean, required: true },
    2: { type: Boolean, required: true },
    3: { type: Boolean, required: true },
    4: { type: Boolean, required: true },
  },
});

const Product = mongoose.model("products", product);

module.exports = Product;
