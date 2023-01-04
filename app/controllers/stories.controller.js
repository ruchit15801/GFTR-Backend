const Stories = require("../models/stories.model")
const HTTP = require("../../constants/responseCode.constant");
const upload = require("../middlewares/uploadBlog")
const multer = require("multer");

// add blog
async function addBlog(req, res) {
    try {
        let image
        for (const data of req.files.image) {
            console.log(data.filename, "-----------bg-------------data");
            image = data.filename
        }
        const { title, content } = req.body

        if (!content || !title) return res.status(HTTP.BAD_REQUEST).send({ 'status': false, 'message': "All fields are required!" })

        const data = await Stories({ title, content, image }).save()
        if (!data) return res.status(HTTP.NOT_FOUND).send({ 'status': false, 'message': "Unable to add blog." })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Added blog successfully.", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// upload blog images
// async function blogImgUpload(req, res) {

//     console.log("🚀 ---------------- blogImgUpload --------------------> ", req.params.id)
//     upload(req, res, function (err) {
//         if (err instanceof multer.MulterError) {
//             console.log("🚀 ~ file: admin.controller.js:98 ~ err", err)
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": 'A Multer error occurred when uploading.', data: {} })
//         } else if (err) {
//             console.log("🚀 ~ file: admin.controller.js:100 ~ err", err)
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": 'An unknown error occurred when uploading.', data: {} })
//         }


//         Stories.findByIdAndUpdate({ _id: req.params.id }, { image: req.file.filename }, { new: true }).then(() => {
//             return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "Blog Images added successfully!", data: {} })
//         }).catch(e => {
//             console.log(e);
//             return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
//         })

//     })
// }

// edit blog
async function editBlog(req, res) {
    try {

        const updates = Object.keys(req.body)

        if (updates.length === 0) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "No changes available for update!", data: {} })

        const allowedUpdates = ['title', 'content', 'image']

        const validateOperator = updates.every((update) => allowedUpdates.includes(update))
        if (!validateOperator) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.BAD_REQUEST, "message": "Update is not allowed!", data: {} })

        var dataRecord = { ...req.body }

        const data = await Stories.findOneAndUpdate({ _id: req.params.id }, dataRecord, { new: true })
        if (!data) return res.status(HTTP.SUCCESS).send({ "status": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'code': HTTP.SUCCESS, "message": "Stories updated successfully!", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// delete blog
async function deleteBlog(req, res) {
    try {

        const updateData = await Stories.findByIdAndUpdate({ _id: req.params.id }, { status: false }, { new: true })
        if (!updateData) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add stories." })

        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Deleted stories successfully.", 'data': updateData })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

// view all blogs
async function viewBlogs(req, res) {
    try {

        const data = await Stories.find({})
        if (!data) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Unable to add stories.", 'data': viewData })



        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "stories data.", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}


async function viewBlogById(req, res) {
    try {
        const _id = req.params.id
        const data = await Stories.findOne({ _id })
        if (!data) return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Could not get blogs data." })



        return res.status(HTTP.SUCCESS).send({ 'status': true, 'message': "Blog data.", data })

    } catch (e) {
        console.log(e)
        return res.status(HTTP.SUCCESS).send({ "success": false, 'code': HTTP.INTERNAL_SERVER_ERROR, "message": "Something went wrong!", data: {} })
    }
}

module.exports = {

    addBlog,
    // blogImgUpload,
    editBlog,
    deleteBlog,
    viewBlogs,
    viewBlogById

}