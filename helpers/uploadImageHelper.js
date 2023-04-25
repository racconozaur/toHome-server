const cloudinary = require('cloudinary').v2

cloudinary.config({
  cloud_name: 'jasapr',
  api_key: '842611295684353',
  api_secret: 'vrTbCTExPYktT4X7hPY4gWeXANM',
});

module.exports = cloudinary