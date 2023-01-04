const Gift = require("../models/gift.model")
const Addto = require("../models/addtogift.model")
const HTTP = require("../../constants/responseCode.constant");
const upload = require("../middlewares/uploadgift")
const uploadForm = require("../middlewares/uploadaddtoform")
const multer = require("multer");

// add folder
async function addFolder(req, res) {
    try {
        const { folder_name } = req.body
        const gift = Gift({
            folder_name
        }).save()
        if (!req.body) return res.status(HTTP.BAD_REQUEST).send({ 'status': false, 'message': "All fields are required!" })
        if (!gift) return res.status(HTTP.NOT_FOUND).send({ 'status': false, 'message': "Unable to add gift." })
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Added gift successfully.", data: {} })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// Add to
async function addTo(req, res) {
    try {
        let image
        for (const data of req.files.image) {
            console.log(data, "-----------bg-------------data");
            image = data.filename
        }
        // console.log(image, "----image");
        if (!image) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.NOT_ALLOWED, "message": "All fields are required!", data: {} })
        let formdata = [{ title: req.body.title, price: req.body.price, notes: req.body.notes, image }]
        const addToData = await Gift.findByIdAndUpdate({ _id: req.params.id }, { $push: { formdata } }, { new: true })
        if (!addToData) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add gift.", 'data': {} })
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "gift data add succesfully", addToData })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// view folder
async function viewfolder(req, res) {
    try {

        let folders = []
        const data = await Gift.find({})
        if (!data) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add gift.", 'data': viewData })
        let folder = data[0].folder_name
        for (let d of data) {
            let name = d.folder_name
            let id = d._id
            folders.push(id, name)
        }
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "gift data.", folders })
    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// edit gift
async function editGift(req, res) {
    try {
        const updates = Object.keys(req.body)
        if (updates.length === 0) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "No changes available for update!", data: {} })
        const allowedUpdates = ['folder_name', 'title', 'price', 'notes', 'image']
        const validateOperator = updates.every((update) => allowedUpdates.includes(update))
        if (!validateOperator) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Update is not allowed!", data: {} })
        var dataRecord = { ...req.body }
        const data = await Gift.findOneAndUpdate({ _id: req.params.id }, dataRecord, { new: true })
        if (!data) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "gift updated successfully!", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// delete gift
async function deleteGift(req, res) {
    try {

        const updateData = await Gift.findByIdAndDelete({ _id: req.params.id }, { new: true })
        if (!updateData) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add gift." })
        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Deleted gift successfully.", 'data': updateData })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// view all gift
async function viewGift(req, res) {
    try {

        const data = await Gift.find({})
        if (!data) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add gift.", 'data': viewData })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "gift data.", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}



module.exports = {

    addFolder,
    editGift,
    deleteGift,
    viewGift,
    addTo,
    viewfolder
}