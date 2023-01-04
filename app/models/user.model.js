var mongoose = require('mongoose')
const { Schema, model } = require("mongoose");
const validator = require("validator");
var SchemaTypes = mongoose.Schema.Types;
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;

const user = new Schema({
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        // unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: [true, "Required"],
        trim: true,
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: "users",
        //required: [true, "Required"]
    },
    avatar: {
        //type: Buffer,
        type: String,
        // default: "assets/avatar/profile-pic.jpg",
        trim: true
    },
    child: {
        type: Array,
    },
    otpCheck: {
        type: Number,
        default: 0
    },
    // countryCode: {
    //     type: String,
    //     // required: [true, "Country code is required"],
    //     trim: true
    // },
    phoneNumber: {
        type: Number,
        // required: [true, "Required"],
        trim: true
    },
    isVerified: {
        type: Boolean,
        required: [true, "Required"],
        default: false,
    },
    status: {
        // type: Boolean,
        // default: true
        type: String,
        default: "Unblocked"
    },
    role: {
        type: String,
        default: 'user',
        trim: true
    }

}, { timestamps: true, versionKey: false })


user.plugin(mongooseFieldEncryption, {
    fields: ["username", "email"],
    secret: "somesecretkey",
    saltGenerator: function (secret) {
        return "1234567890123456";
    },
});

const users = model(
    "users",
    user
);

module.exports = { users }  