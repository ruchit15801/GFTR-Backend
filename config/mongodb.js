const mongoose = require('mongoose')

function mongoConnect() {
    // Database connection
    mongoose.connect(process.env.MONGODB, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }).then(() => console.log("DB connection successful!"))
        .catch((err) => {
            console.log(err)
            console.log("Error connecting DB!")
        });
}

module.exports = mongoConnect()