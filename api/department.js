const express = require('express');
const router = express.Router();
const Joi = require('joi')
const app = require('../application/department')
const validator = require('express-joi-validation').createValidator({})

router.get('/', async (req, res) => {
    app.getAll((err, result) => {
        if (err) {
            return res.status(500).json({ ok: false, message: err.message });
        }
        
        res.json(result.data);
    });
});

router.route('/admin')
    .post(validator.body(Joi.object({name: Joi.string().required(),
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