const express = require('express');
const router = express.Router();
const appointments = require('../application/appointments');
const Joi = require('joi')
const validator = require('express-joi-validation').createValidator({})

function createAppointmentValidate() {
    return Joi.object({
        doctor: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        clinic: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required(),
        date: Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/).required(),
        startTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):(00|30)$/).required(),
        endTime: Joi.string().regex(/^([01]?[0-9]|2[0-3]):(00|30)$/).required(),
    })
}

router.route('/')
    .get((req, res) => {
        appointments.getPatientAppointments(req.user._id, req.query.filter, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.json(result.data);
        });
    })
    .post(validator.body(createAppointmentValidate()), (req, res) => {
        appointments.createAppointment({patient: req.user._id, ...req.body}, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            if (!result.ok) {
                return res.status(400).json({ msg: result.message });
            }
            res.status(201).json(result.data);
        });
    });

router.route('/available/days')
    .get((req, res) => {
        appointments.findAvailableDays({departmentId: req.query.departmentId, month: req.query.month}, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            res.json(result.data);
        });
    });

    router.route('/available')
    .get((req, res) => {
        appointments.findAvailableAppointments(req.query.departmentId, req.query.date, (err, result) => {
            if (err) {
                return res.status(500).json({ ok: false, message: err.message });
            }
            res.json(result.data);
        });
    });

router.route('/:id')
    .delete((req, res) => {
        appointments.cancelAppointment(req.params.id, (err, result) => {
            if (err) {
                return res.status(500).json({ message: err.message });
            }
            if (!result.ok) {
                return res.status(404).json({ message: result.message });
            }
            res.json(result);
        });
    });

module.exports = router; 