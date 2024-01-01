const User = require("./schemas/usersSchema");
const sgMail = require("@sendgrid/mail");
const { sendVerificationEmail } = require("../services/schemas/emailService");
const { Dietary } = require("./schemas/dietarySchema");
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

const createDietary = async (_id, payload) => {
  const { date, products = [] } = payload;

  const dietaryExist = await Dietary.findOne({ owner: _id })
    .where("date")
    .equals(date)
    .populate("owner", "name email")
    .populate({
      path: "products.product",
      select: "title calories",
    });

  if (dietaryExist) {
    throw new Error("Dietary already exists");
  }

  return await Dietary.create({ owner: _id, date, products });
};
const deleteDietary = async (_id, productId, date) => {
  const res = await Dietary.findOneAndUpdate(
    { date: date, owner: _id },
    { $pull: { products: { _id: productId } } },
    { new: true }
  )
    .populate("owner", "name email")
    .populate({
      path: "products.product",
      select: "title calories",
    });

  if (res === null) {
    throw new Error("Wrong date");
  }
  return res;
};
const getDietary = async (_id, payload) => {
  const { date } = payload;

  const dietary = await Dietary.findOne({
    owner: _id,
    date: date,
  })
    .populate("owner", "_id name email")
    .populate({
      path: "products.product",
      select: "title calories",
    });

  return dietary;
};

const updateDietary = async (userId, payload) => {
  const { date, data } = payload;
  const { product: _id, weightGrm } = data;

  let products = null;

  const dayInfo = await Dietary.findOne({
    owner: userId,
    date: date,
  });

  if (dayInfo) {
    const checkedProduct = dayInfo.products.find((obj) =>
      obj.product.equals(_id)
    );

    if (!checkedProduct) {
      products = await Dietary.findOneAndUpdate(
        {
          owner: userId,
          date: date,
        },
        {
          $push: {
            products: data,
          },
        },
        { new: true }
      )
        .populate("owner", "name email")
        .populate({
          path: "products.product",
          select: "title calories",
        });
      return products;
    } else {
      checkedProduct.weightGrm += weightGrm;
    }

    await dayInfo.save();
    products = await Dietary.findOne(dayInfo)
      .populate("owner", "name email")
      .populate({
        path: "products.product",
        select: "title calories",
      });
  } else {
    throw new Error("Wrong date");
  }

  return products;
};

const listProducts = async () => {
  return await Product.find();
};
const updateUserAvatar = async (id, avatarURL) => {
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
  createDietary,
  deleteDietary,
  getDietary,
  updateDietary,
  listProducts,
  updateUserAvatar,
  getUserbyId,
};
