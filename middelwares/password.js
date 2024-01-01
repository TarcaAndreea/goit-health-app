const passport = require("passport");
const passportJWT = require("passport-jwt");
const User = require("../services/schemas/usersSchema");

require("dotenv").config();

const secret = process.env.SECRET_KEY;

const ExtractJWT = passportJWT.ExtractJwt;
const Strategy = passportJWT.Strategy;

const params = {
  secretOrKey: secret,
  jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
};

// JWT
passport.use(
  new Strategy(params, async function (payload, done) {
    try {
      const [user] = await User.find({ email: payload.email });

      if (!user) {
        return done(new Error("Userul nu exista!"));
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);
