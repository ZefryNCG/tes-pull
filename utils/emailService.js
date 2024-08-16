const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  auth: {
    user: config.email.user,
    pass: config.email.pass
  }
});

async function sendVerificationEmail(to, code) {
  const mailOptions = {
    from: config.email.user,
    to: to,
    subject: 'Verifikasi WhatsApp Bot',
    text: `Kode verifikasi Anda adalah: ${code}`
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendVerificationEmail };