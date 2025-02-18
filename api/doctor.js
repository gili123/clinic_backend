const express = require('express');
const router = express.Router();
const Joi = require('joi')
const app = require('../application/doctor');
const validator = require('express-joi-validation').createValidator({})

router.route('/')
    .get((req, res) => {
        app.getAllDoctors((err, result) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err.message });
            }
            res.json(result.data);
        });
    });

router.route('/admin')
    .post(validator.body(Joi.object({firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        specialties: Joi.array().items(Joi.string().regex(/^[0-9a-fA-F]{24}$/)).required(),
    })),
    function (req, res) {
        app.create(req.body, (err, result) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err.message });
            }
            res.status(201).json(result.data);
        });
    });

module.exports = router;
