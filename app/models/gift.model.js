const mongoose = require('mongoose')
const Schema = mongoose.Schema

const geftedSchema = new Schema({

    folder_name: {
        type: String,
        // required: true,
        trim: true
    },
    isPublic: {
        type: Boolean,
        default: true,
    },
    isPrivate: {
        type: Boolean
    },
    formdata: [{
        title: {
            type: String,
            // required: true,
        },
        price: {
            type: String,
            // required: true,
        },
        notes: {
            type: String,
            // required: true,
        },
        image: {
            type: String,
            // required: true,
        }
    }],
    userid: {
        type: mongoose.Schema.Types.ObjectId,
        // required: [true, "User id is required"],
        ref: 'users'
    },

}, { timestamps: true, versionKey: false })

module.exports = mongoose.model('GiftFolder', geftedSchema)