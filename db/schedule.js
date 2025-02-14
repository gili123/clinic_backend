const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    clinic: { type: mongoose.Schema.Types.ObjectId, ref: "Clinic", required: true },
    dayOfWeek: {  type: Number,  required: true, min: 0,  max: 6, },
    startTime: { 
        type: String,  
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: { 
        type: String, 
        required: true,
        match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
  });

module.exports = mongoose.model('Schedule', scheduleSchema);