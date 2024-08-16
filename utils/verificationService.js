const fs = require('fs').promises;
const path = require('path');
const { sendVerificationEmail } = require('./emailService');

const dbPath = path.join(__dirname, '..', 'database.json');

async function readDatabase() {
  const data = await fs.readFile(dbPath, 'utf8');
  return JSON.parse(data);
}

async function writeDatabase(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function startVerification(phone, email) {
  const code = generateVerificationCode();
  const db = await readDatabase();
  
  const userIndex = db.users.findIndex(user => user.phone === phone);
  if (userIndex !== -1) {
    db.users[userIndex] = { phone, email, verified: false, verificationCode: code };
  } else {
    db.users.push({ phone, email, verified: false, verificationCode: code });
  }
  
  await writeDatabase(db);
  await sendVerificationEmail(email, code);
  return code;
}

async function verifyCode(phone, inputCode) {
  const db = await readDatabase();
  const user = db.users.find(u => u.phone === phone);
  
  if (user && user.verificationCode === inputCode) {
    user.verified = true;
    user.verificationCode = null;
    await writeDatabase(db);
    return true;
  }
  return false;
}

async function isVerified(phone) {
  const db = await readDatabase();
  const user = db.users.find(u => u.phone === phone);
  return user ? user.verified : false;
}

module.exports = { startVerification, verifyCode, isVerified };