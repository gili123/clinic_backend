const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialties: [{ type: mongoose.Schema.Types.ObjectId, ref: "Department" }],
  });

module.exports = mongoose.model('Doctor', doctorSchema);