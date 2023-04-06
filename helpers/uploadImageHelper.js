const cloudinary = require('cloudinary').v2

const cloud_name = process.env.CLOUD_NAME;
const api_key = process.env.API_KEY;
const api_secret = process.env.API_SECRET;

cloudinary.config({
  cloud_name: 'jasapr',
  api_key: '842611295684353',
  api_secret: 'vrTbCTExPYktT4X7hPY4gWeXANM',
});

module.exports = cloudinary