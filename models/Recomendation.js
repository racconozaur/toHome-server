const {Schema, model, ObjectId} = require("mongoose")

const Location = new Schema({
    longitude: {type: Number},
    latitude: {type: Number}
})

const Message = new Schema({
    sender: {type: String, required: true },
    name: {type: String},
    number: {type: Number},
    title: {type: String},
    status: {type: String},
    type: {type: String},
    rooms: {type: Number},
    square: {type: Number},
    location: Location,
    price: {type: Number},
    content: {type: String},
    image: {type: String},
    moderated: {type: Boolean},
    validation: {type: String},
    likes: { type: Array, default: [] }
})

module.exports = model('Message', Message)