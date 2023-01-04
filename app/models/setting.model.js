const mongoose = require('mongoose')
const Schema = mongoose.Schema

const settingSchema = new Schema({
    whoCanSee: {
        type: String,
        required: [true, "Required"]
    },
    birthdayReminder: {
        type: String,
        required: [true, "Required"]
    },
    holidayReminder: {
        type: String,
        required: [true, "Required"]
    },
    emailOrText: {
        type: String,
        required: [true, "Required"]
    },
    birthday: {
        type: Date,
        required: [true, "Required"]
    },
    phoneNumber: {
        type: Number,
        required: [true, "Required"]
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    address: {
        type: String,
        required: [true, "Required"]
    },
    myanniversary: {
        type: Date,
        required: [true, "Required"]
    },
    valentineday: {
        type: Date,
        required: [true, "Required"]
    },
    easter: {
        type: Date,
        required: [true, "Required"]
    },
    mothersday: {
        type: Date,
        required: [true, "Required"]
    },
    fathersday: {
        type: Date,
        required: [true, "Required"]
    },
    hanukkah: {
        type: Date,
        required: [true, "Required"]
    },
    christmas: {
        type: Date,
        required: [true, "Required"]
    }


}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('setting', settingSchema)