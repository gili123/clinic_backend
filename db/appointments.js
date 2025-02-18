const mongoose = require('mongoose');
const moment = require('moment');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true },
  date: { type: Date, required: true, format: 'YYYY-MM-DD HH:mm' },
  startTime: { type: String, required: true, format: 'HH:mm' },
  endTime: { type: String, required: true, format: 'HH:mm' },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
