const express = require('express');
const Joi = require('joi')
const router = express.Router();
const app = require('../application/schedule');
const validator = require('express-joi-validation').createValidator({})

router.route('/admin')
    .post(validator.body(Joi.object({dayOfWeek: Joi.number().min(0).max(6).required(),
        startTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):(00|30)$/).required(),
        endTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):(00|30)$/).required(),
        doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        clinic: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
    })),
    function (req, res) {
        app.create(req.body, (err, result) => {
            if (err) {
                return res.status(400).json({ ok: false, message: err.message });
            }
            res.status(201).json(result);
        });
    });

module.exports = router;
