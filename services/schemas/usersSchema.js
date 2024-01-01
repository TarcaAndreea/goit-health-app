const mongoose = require("mongoose");
const bCrypt = require("bcryptjs");
const gravatar = require("gravatar");
const path = require("path");
const Schema = mongoose.Schema;
const jwt = require("jsonwebtoken");

// Assuming you have an 'avatars' array defined somewhere
const avatars = ["avatar1.jpg", "avatar2.jpg", "avatar3.jpg"];

const user = new Schema(
  {
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    tokens: {
      accessToken: {
        type: String,
      },
      refreshToken: {
        type: String,
      },
      type: Object,
      default: null,
    },
    userInfo: {
      type: Object,
      default: null,
    },
    userDailyCalorieIntake: {
      type: Number,
      default: "",
    },
    userNotRecommendedProducts: {
      type: Array,
      default: [],
    },
    avatarURL: {
      type: String,
      default: function () {
        const avatarURL = path.join(
          "defaultAvatars",
          avatars[Math.floor(Math.random() * avatars.length)]
        );
        return avatarURL;
      },
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

user.methods.setPassword = function (password) {
  this.password = bCrypt.hashSync(password, bCrypt.genSaltSync(6));
};

user.methods.validPassword = function (password) {
  return bCrypt.compareSync(password, this.password);
};
user.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

  this.tokens = { accessToken: token };

  return token;
};
user.pre("save", function (next) {
  if (!this.avatarURL) {
    this.avatarURL = gravatar.url(
      this.email,
      {
        s: 200,
        r: "pg",
        d: "identicon",
      },
      true
    );
  }
  next();
});

const User = mongoose.model("User", user);

module.exports = User;
