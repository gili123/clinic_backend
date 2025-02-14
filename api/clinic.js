const express = require('express')
const router = express.Router()
const Joi = require('joi')
const app = require('../application/clinic')
const validator = require('express-joi-validation').createValidator({})

router.route('/admin')
    .get((req, res) => {
        app.getAllClinics((err, result) => {
            if(err) {
                return res.status(500).json({ok: false, message: err.message})
            }
            res.json(result.data)
        })
    })
    .post(validator.body(Joi.object({name: Joi.string().required(),
        city: Joi.string().required(),
        timeZone: Joi.string().required(),
    })),
    function (req, res) {
        app.create(req.body, (err, result) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err.message });
            }
            res.status(201).json(result.data);
        });
    });

module.exports = router

