const sgMail = require("@sendgrid/mail");

const sendVerificationEmail = async (email, verificationToken) => {
  const msg = {
    to: email,
    from: "adrianatarca1@gmail.com",
    subject: "Verify your email",
    text: `Your unique code is ${verificationToken}, please verify your email address clicking the code!`,
    html: `<p>Please verify your email address by clicking the following link: <a href=http://localhost:5000/users/verify/${verificationToken}>Verify Email</a></p>`,
  };

  return sgMail
    .send(msg)
    .then(() => console.log("Email sent"))
    .catch((error) => {
      console.error("Email was NOT sent!", error);
      throw new Error("Email was NOT sent!");
    });
};

module.exports = {
  sendVerificationEmail,
};
