var cryptoJS = require("crypto-js")

function encodeData(data) {
    try {
        const plainData = JSON.stringify(data)
        const cipherData = cryptoJS.AES.encrypt(plainData, process.env.CRYPTO_SECRET_KEY).toString()
        return cipherData
    } catch {
        return ""
    }
}

function decodeData(data) {
    try {
        const bytes = cryptoJS.AES.decrypt(data, process.env.CRYPTO_SECRET_KEY)
        const plainData = JSON.parse(bytes.toString(cryptoJS.enc.Utf8));
        return plainData
    } catch {
        return {}
    }
}

function encodeResData(body, req, res) {
    try {
        const plainData = JSON.stringify(body)
        const cipherData = cryptoJS.AES.encrypt(plainData, process.env.CRYPTO_SECRET_KEY).toString()
        return { data: cipherData }
    } catch (e) {
        console.log(e);
        return {}
    }
}

function decodeReqData(req, res, next) {
    try {
        if (!req.body || !req.body.data) {
            next()
        } else {
            const bytes = cryptoJS.AES.decrypt(req.body.data, process.env.CRYPTO_SECRET_KEY)
            const plainData = JSON.parse(bytes.toString(cryptoJS.enc.Utf8));
            req.body = plainData
            next()
        }
    } catch (e) {
        console.log(e);
        next()
    }
}


module.exports = {
    encodeData,
    decodeData,
    encodeResData,
    decodeReqData
}

