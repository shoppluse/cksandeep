const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (email, token) => {

  const url = `https://cloud-kitchen-cjs2.onrender.com/api/verify/${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify your Cloud Kitchen account",
    html: `
      <h2>Cloud Kitchen Account Verification</h2>
      <p>Click the link below to verify your account:</p>
      <a href="${url}">Verify Account</a>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendVerificationEmail;
