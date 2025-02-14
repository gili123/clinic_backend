const user = require('../db/user')
const jwt = require('jsonwebtoken');

const otpStore = new Map();
const generateOtp = () => Math.floor(1000 + Math.random() * 9000);

module.exports = {

    auth: async function (token, role, cb) {
        const sp = token.split(" ")
        if(sp.length != 2) {
            return cb(null, {ok: false, code: 'Unauthorized'});
        } else if(sp[0] !== 'Bearer') {
            return cb(null, {ok: false, code: 'Unauthorized'});
        }

        jwt.verify(sp[1], process.env.JWT_SECRET, async function (err, decoded) {
            if (err || !decoded) {
                return cb(null, {ok: false, code: 'Unauthorized'});
            }

            if(role === 'admin' && decoded.role !== 'admin') {
                return cb(null, {ok: false, code: 'Unauthorized'});
            }

            item = await user.findById(decoded.id)
            if(!item) {
                return cb(null, {ok: false, code: 'Unauthorized'});
            }
            
            return cb(null, {ok: true, user: item})
        })
    },

    login: async function (body, cb) {
        const otp = generateOtp();
        otpStore.set(body.phone, {code: otp, name: body.name, ttl: Date.now() + 1000 * 60 * 3});
        
        return cb(null, {ok: true, data: {otp}})
    },

    verifyOtp: async function (body, cb) {
        const otp = otpStore.get(body.phone)
        if(otp?.code !== body.otp) {
            return cb(null, {ok: false, message: 'קוד לא נכון'})
        }

        if(otp.ttl < Date.now()) {
            return cb(null, {ok: false, message: 'קוד לא תקף'})
        }

        otpStore.delete(body.phone)
        let role = 'user'
        if(body.phone === '0501234567') {
            role = 'admin'
        }
        const doc = await user.findOneAndUpdate(
            { phone: body.phone }, 
            {name: otp.name, role}, 
            {new: true, upsert: true}
        ).catch((err)=>{
            return cb(err)
        })

        const accessToken = generateToken(doc, role)
        const data = {
            id: doc._id,
            name: doc.name,
            phone: doc.phone,
            role,
            accessToken
        }

        return cb(null, {ok: true, data})
    },
}

function generateToken(user, role) {
    const token = jwt.sign({id: user._id, role}, process.env.JWT_SECRET, {
        expiresIn: 86400 * 365 // expires in 365 days
    });

    return token
}