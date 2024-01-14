const { Products } = require("../services/schemas/productSchema");

const getProducts = async (req, res, next) => {
  try {
    const results = await services.getProducts();
    res.json({
      status: "Success",
      code: 200,
      data: results,
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      code: 404,
    });
    next(error);
  }
};
const getMyProducts = async (req, res) => {
  try {
    const { date } = req.body;
    const { _id } = req.user;

    const productList = await MyProducts.find({ owner: _id, date });
    console.log(productList);
    return res.status(200).json({ status: "success", code: 200, productList });
  } catch (error) {
    res.status(404).json({
      status: "error",
      code: 404,
    });
  }
};
const deleteMyProducts = async (req, res) => {
  try {
    const { productId } = req.params;
    const { date } = req.body;
    const { _id } = req.user;

    const product = await MyProducts.findOneAndUpdate(
      { date, productInfo: { $elemMatch: { _id: productId } } },
      {
        $pull: {
          productInfo: { _id: productId },
        },
      }
    );

    if (product.productInfo.length === 0) {
      await MyProducts.findOneAndDelete({ date });
    }

    if (!product) {
      NotFound(`Product with id = ${productId} not found`);
    }

    const newProduct = await MyProducts.findOne({
      date,
      owner: _id,
    });

    return res.status(200).json({
      status: "success",
      code: 200,
      newProduct,
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      code: 404,
    });
  }
};
const getAllProductsByQuery = async (req, res, next) => {
  try {
    const {
      query: { title, limit = 10 },
    } = req;
    const titleFromUrl = decodeURI(title).trim();
    const products = await Product.find({
      $or: [{ $text: { $search: titleFromUrl } }],
    }).limit(limit);
    if (products.length === 0) {
      const newProducts = await Product.find({
        $or: [{ title: { $regex: titleFromUrl, $options: "i" } }],
      }).limit(limit);

      if (newProducts.length === 0) {
        return error;
      }
      return res.status(200).json({ data: newProducts });
    }
    return res.status(200).json({ data: products });
  } catch (error) {
    res.status(404).json({
      status: "error",
      code: 404,
    });
    next(error);
  }
};

const addMyProducts = async (req, res) => {
  try {
    console.log(req.user);
    const { _id } = req.user;
    const { productName, productWeight, date } = req.body;
    console.log(req.body);
    const productCalories = await services.countCalories(
      productName,
      productWeight
    );
    const product = await MyProducts.findOne({
      date,
      owner: _id,
      productInfo: { $elemMatch: { productName } },
    });
    if (product) {
      const index = product.productInfo.findIndex(
        (product) => product.productName === productName
      );
      const newWeight =
        Number(product.productInfo[index].productWeight) +
        Number(productWeight);
      const newCalories =
        Number(product.productInfo[index].productCalories) +
        Number(productCalories);
      await MyProducts.findOneAndUpdate(
        { date, owner: _id },
        {
          $pull: {
            productInfo: { productName },
          },
        }
      );
      await MyProducts.findOneAndUpdate(
        { date, owner: _id },
        {
          $push: {
            productInfo: {
              $each: [
                {
                  productCalories: newCalories.toString(),
                  productName,
                  productWeight: newWeight.toString(),
                },
              ],
              $position: 0,
            },
          },
        }
      );
      const newProduct = await MyProducts.findOne({
        date,
        owner: _id,
      });

      return res
        .status(201)
        .json({ success: "success", code: 201, newProduct });
    }
    if (await MyProducts.findOne({ date, owner: _id })) {
      await MyProducts.findOneAndUpdate(
        { date, owner: _id },
        {
          $push: {
            productInfo: {
              $each: [
                {
                  productCalories,
                  productName,
                  productWeight,
                },
              ],
              $position: 0,
            },
          },
        }
      );
      const newProduct = await MyProducts.findOne({
        date,
        owner: _id,
      });

      return res
        .status(201)
        .json({ success: "success", code: 201, newProduct });
    }
    const newProduct = await MyProducts.create({
      date,
      owner: _id,
      productInfo: [{ productCalories, productName, productWeight }],
    });
    return res.status(201).json({
      success: "success",
      code: 201,
      newProduct,
    });
  } catch (error) {
    res.status(404).json({
      status: "error",
      code: 404,
    });
  }
};
module.exports = {
  getProducts,
  getMyProducts,
  deleteMyProducts,
  getAllProductsByQuery,
  addMyProducts,
};
