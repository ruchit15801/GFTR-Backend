const mongoose = require('mongoose')
const Schema = mongoose.Schema

const geftedSchema = new Schema({

    title: {
        type: String,
        // required: true,
        trim: true
    },
    price: {
        type: String,
        // required: true,
    },
    image: {
        type: String,
        // required: true,
    },
    notes: {
        type: String,
        // required: [true, "User id is required"],
    }

}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('AddtoGift', geftedSchema)