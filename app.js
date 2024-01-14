const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const mongoose = require("mongoose");
const contactsRouter = require("./routes/api/users");
const dotenv = require("dotenv");
const path = require("path");
const sgMail = require("@sendgrid/mail");
dotenv.config();
require("./middelwares/password.js");

const app = express();

const formatsLogger = app.get("env") === "development" ? "dev" : "short";
app.use(express.static(path.join(__dirname, "public")));
app.use(logger(formatsLogger));
app.use(cors());
app.use(express.json());
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
app.use("/api", contactsRouter);
app.use((_, res, __) => {
  res.status(404).json({
    status: "error",
    code: 404,
    message: "Route not found",
    data: "Not found!",
  });
});

app.use((err, _, res, __) => {
  console.log(err.stack);
  res.status(500).json({
    status: "fail",
    code: 500,
    message: err.message,
    data: "Internal Server error!",
  });
});

const PORT = process.env.PORT_SERVER || 3000;
const URL_DB = process.env.DB_URL;

mongoose
  .connect(URL_DB)
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`Server is running. Use our API on port:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(`Database connection error: ${err.message}`);
    process.exit(1);
  });

module.exports = app;
