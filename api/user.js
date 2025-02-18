const express = require('express');
const Joi = require('joi')
const app = require('../application/user')
const userRouter = express.Router();
const validator = require('express-joi-validation').createValidator({})

function loginValidate() {
    return Joi.object({
        name: Joi.string().pattern(/^(?=(?:.*[a-zA-Zא-ת]){2})[a-zA-Zא-ת\s]{2,15}$/).required(),
        phone: Joi.string().pattern(/^((\+972[- ]?|0)([23489]|5[0123456789])\d{7}|\+?[1-9]\\d{1,14})$/).required()
    })
}

function verifyValidate() {
    return Joi.object({
        otp: Joi.number().min(1000).max(9999).required(),
        phone: Joi.string().pattern(/^((\+972[- ]?|0)([23489]|5[0123456789])\d{7}|\+?[1-9]\\d{1,14})$/).required(),
    });
}

userRouter.route('/login')
    .post(validator.body(loginValidate()), function (req, res) {
        app.login(req.body, (err, infraRes)=> {
            if(err) {
                return res.status(500).send({message: 'Internal Server Error'});
            }
            
            res.status(200).send(infraRes.data)
        })
    })

userRouter.route('/verify')
    .post(validator.body(verifyValidate()), function (req, res) {
        app.verifyOtp(req.body, (err, infraRes)=> {
            if(err) {
                return res.status(500).send({message: 'Internal Server Error'});
            } else if(!infraRes.ok) {
                return res.status(403).send({message: infraRes.message});
            }
            
            res.status(200).send(infraRes.data)
        })
    })

userRouter.route('/')
    .post(function (req, res) {
        app.save(req.body).then((item) => {
            res.status(201).json(item);
        }).catch((err) => {
            res.status(500).json(err);
        })
    })

module.exports = userRouter;