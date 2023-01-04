const mongoose = require('mongoose')
const Schema = mongoose.Schema

const adminSchema = new Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true
    },
    password: {
        type: String,
        trim: true
    }
}, { timestamps: true, versionKey: false })


module.exports = mongoose.model('Admin', adminSchema)
