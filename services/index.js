const User = require("./schemas/usersSchema");
const sgMail = require("@sendgrid/mail");
const { sendVerificationEmail } = require("../services/schemas/emailService");
const { myDailyInfo } = require("./schemas/dailyInfo");
const { Product } = require("./schemas/productSchema");
let nanoid;
import("nanoid").then((module) => {
  nanoid = module.nanoid;
});

const getAllUsers = async () => {
  return User.find();
};
const createUser = async ({ name, email, password }) => {
  try {
    const userExisting = await User.findOne({ email });
    if (userExisting) {
      throw new Error("This email is already in use");
    }

    const uniqueCodeVerify = nanoid();

    await sendVerificationEmail(email, uniqueCodeVerify);

    const newUser = new User({
      name,
      email,
      password,
      verificationToken: uniqueCodeVerify,
    });
    newUser.setPassword(password);
    newUser.generateAuthToken();
    return await newUser.save();
  } catch (error) {
    console.log(error);
    throw error;
  }
};

const checkUserDB = async ({ email, password }) => {
  try {
    console.log(`Parola din checkUserDB:${password}`);
    const user = await User.findOne({ email });
    if (!user || !user.validPassword(password)) {
      throw new Error("Email or password is wrong");
    }
    return user;
  } catch (error) {
    console.log(error);
  }
};

const findUser = async (user) => {
  const result = await User.findOne({ email: user.email });
  return result;
};

const logOutUser = async (userId) => {
  console.log(`Logging out user with ID: ${userId}`);

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log(`User with ID: ${userId} not found`);
      throw new Error("User not found");
    }
    user.tokens = [];
    await user.save();

    return {
      status: "Success",
      message: "User logged out successfully",
    };
  } catch (error) {
    console.log(`Error logging out user with IDL ${userId}`);
    return {
      status: "Error",
      message: error.message,
    };
  }
};

const verifyEmail = async (verificationToken) => {
  const update = { verify: true, verificationToken: null };

  const result = await User.findOneAndUpdate(
    {
      verificationToken,
    },
    { $set: update },
    { new: true }
  );
  console.log(result);
  if (!result) {
    throw new Error("User not found");
  }
};

const updateUser = async (id, majorUpdate) => {
  console.log(id, majorUpdate);
  console.log(majorUpdate);

  //  { $set: { name: 'jason bourne' }
  return User.findByIdAndUpdate(
    { _id: id },
    { $set: majorUpdate },
    { new: true }
  );
};

const getUserbyId = async (id) => {
  const user = await User.findById(id);
  return user;
};
const getNotAllowedProducts = async ({ bloodType }) => {
  const blood = [null, false, false, false, false];
  blood[bloodType] = true;
  const products = await Product.find({
    groupBloodNotAllowed: { $all: [blood] },
  });
  return products;
};
const notAllowedProductsObj = async (bloodType) => {
  const notAllowedProductsArray = await getNotAllowedProducts(bloodType);
  const arr = [];
  notAllowedProductsArray.map(({ title }) => arr.push(title));
  let notAllowedProductsAll = [...new Set(arr)];
  let notAllowedProducts = [];
  const message = ["You can eat everything"];
  if (notAllowedProductsAll[0] === undefined) {
    notAllowedProducts = message;
  } else {
    do {
      const index = Math.floor(Math.random() * notAllowedProductsAll.length);
      if (
        notAllowedProducts.includes(notAllowedProductsAll[index]) ||
        notAllowedProducts.includes("undefined")
      ) {
        break;
      } else {
        notAllowedProducts.push(notAllowedProductsAll[index]);
      }
    } while (notAllowedProducts.length !== 5);
  }
  if (notAllowedProductsAll.length === 0) {
    notAllowedProductsAll = message;
  }
  const result = { notAllowedProductsAll, notAllowedProducts };
  return result;
};
const caloriesValue = async (productName, productWeight) => {
  const product = await Product.findOne({
    title: productName,
  });
  if (!product) {
    NotFound("Product name is not correct");
  }
  const { calories, weight } = product;
  const productCalories = Math.round((calories / weight) * productWeight);
  return productCalories;
};
const listProducts = async (id, avatarURL) => {
  const userData = await User.findByIdAndUpdate(id, { avatarURL });

  return userData.avatarURL;
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  checkUserDB,
  logOutUser,
  findUser,
  verifyEmail,
  listProducts,
  caloriesValue,
  getNotAllowedProducts,
  notAllowedProductsObj,
  getUserbyId,
};
