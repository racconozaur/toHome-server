const {Schema, model, ObjectId} = require("mongoose")

const Ads = new Schema({
    image: {type: String},
    link: {type: String},
    description: {type: String}
})

module.exports = model('Ads', Ads)