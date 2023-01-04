const JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
const opts = {}
const Admin = require('../app/models/admin.model')
const {users} = require('../app/models/user.model')
const passport = require('passport')

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET;

passport.use(new JwtStrategy(opts, function (jwt_payload, done) {
console.log('---------------------------------------passport-------');
console.log(jwt_payload.id)

    users.findOne({ _id: jwt_payload.id }, function (err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            const userData = { user, sessionId: jwt_payload.sessionId } 
            if(userData.sessionId == "" || userData.sessionId == "undefined") return done(null, user)
            return done(null, userData)

            // if(userData) return done(null, userData);
            // return done(null, user)
        } else {
            return done(null, false);
        }
    });
}));