const {
  getAllUsers,
  createUser,
  updateUser,
  checkUserDB,
  findUser,
  verifyEmail,
} = require("../services/index");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const Jimp = require("jimp");
const secret = process.env.SECRET;
const fs = require("fs");
const path = require("path");
const { sendVerificationEmail } = require("../services/schemas/emailService");
const { nanoid } = require("nanoid");
const getUsersController = async (req, res, next) => {
  try {
    const results = await getAllUsers();
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

const createUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log(email);
    const result = await createUser({
      email,
      password,
    });

    const payload = { email: result.email };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    res.status(201).json({
      status: "succes",
      code: 201,
      data: { email: result.email, token },
    });
  } catch (error) {
    res.status(404).json({
      status: 404,
      error: error.message,
    });
  }
};

const loginUserController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await checkUserDB({
      email,
      password,
    });

    const payload = { email: result.email };

    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    res.status(201).json({
      status: "succes",
      code: 201,
      data: {
        email: result.email,
        token,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 404,
      error: error.message,
    });
  }
};
const logoutUserController = async (req, res, _id) => {
  try {
    const user = await getUserbyId();
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }
    user.token = null;
    await user.save();

    return res.status(204).send();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAll = async (req, res, next) => {
  try {
    const results = await getAllContacts();
    if (!results || results.length === 0) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: "Contacts not found",
      });
    }

    res.json({
      status: "Success",
      code: 200,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

const updateUserController = async (req, res, next) => {
  const { userId } = req.params;
  const { major } = req.body;
  try {
    const result = await updateUser(userId, { major });
    console.log(result);
    if (result) {
      res.status(200).json({
        status: "updated",
        code: 200,
        data: result,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(404).json({
      status: "error",
    });
  }
};
const findUserController = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Missing Authorization header",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Missing token",
      });
    }

    let tokenDecode;
    try {
      tokenDecode = jwt.verify(token, secret);
      console.log(tokenDecode);
    } catch (error) {
      return res.status(401).json({
        status: "error",
        code: 401,
        message: "Invalid token",
        data: error.message,
      });
    }

    const result = await findUser({ email: tokenDecode.email });
    console.log(result);
    if (result) {
      res.status(200).json({
        status: "Success",
        code: 200,
        data: {
          email: result.email,
          subscription: result.subscription,
          id: result._id,
        },
      });
    } else {
      res.status(404).json({
        status: "error",
        code: 404,
        message: "Not authorized",
      });
    }
  } catch (error) {
    next(error);
  }
};

const uploadAvatarController = async (req, res, next) => {
  console.log("test");
  try {
    if (!req.file) {
      return res.status(404).json({ error: "Nu exista fisier de incarcat!" });
    }

    const image = await Jimp.read(req.file.path);
    await image.resize(250, 250);

    const uniqueFilename = `${req.user._id}-${Date.now()}${path.extname(
      req.file.originalname
    )}`;
    const destinationPath = path.join(
      __dirname,
      "../public/avatars",
      uniqueFilename
    );

    if (!fs.existsSync(path.dirname(destinationPath))) {
      fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
    }

    await image.writeAsync(destinationPath);
    fs.unlinkSync(req.file.path);

    if (req.user) {
      req.user.avatarUrl = `/avatars/${uniqueFilename}`;
      await req.user.save();
      res.status(200).json({ avatarUrl: req.user.avatarUrl });
    } else {
      res.status(404).json({ error: "Utilizatorul nu a fost gasit!" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Eroare interna de server." });
    next(error);
  }
};

const generateVerificationToken = () => {
  return nanoid();
};
const verifyEmailController = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    console.log(verificationToken);
    await verifyEmail(verificationToken);

    res.status(200).json({ mesaj: "Email verificat cu success", code: 200 });
  } catch (error) {
    res.status(404).json({
      status: "error",
      message: error.message,
    });
  }
};
const resendVerificationEmailController = async (req, res, next) => {
  try {
    const { email } = req.body;
    console.log(email);
    if (!email) {
      return res.status(400).json({ message: "missing required field email" });
    }

    const user = await findUser({ email });
    if (!user) {
      return res.status(400).json({ message: "User does not exist" });
    }
    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }
    console.log(`User verify status: ${user.verify}`);
    const verificationToken = await generateVerificationToken();
    console.log(`Generated verification token: ${verificationToken}`);
    user.verificationToken = verificationToken;
    await user.save();
    try {
      await sendVerificationEmail(email, verificationToken);
      res.status(200).json({ message: "Verification email resent" });
      console.log("Sent verification email");
    } catch (error) {
      console.error("Failed to send verification email:", error);
    }
  } catch (error) {
    res.status(500).json({ message: "An error occurred" });
    console.log(error);
  }
};
module.exports = {
  getAll,
  getUsersController,
  createUserController,
  updateUserController,
  loginUserController,
  logoutUserController,
  findUserController,
  uploadAvatarController,
  verifyEmailController,
  resendVerificationEmailController,
};
