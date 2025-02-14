const Appointment = require('../db/appointments');
const Doctor = require('../db/doctor');
const Schedule = require('../db/schedule');
const Clinic = require('../db/clinic');
const moment = require('moment-timezone');

async function getPatientAppointments(patientId, filter, callback) {
  
    let query = Appointment.find({ patient: patientId }).sort({ date: 1 });
    
    const appointments = await query.populate({ path: 'doctor' }).populate({ path: 'clinic' });
    
    const filteredAppointments = appointments.filter(appointment => {
        const timezone = appointment.clinic.timeZone || 'UTC'
        const appointmentDate = moment(appointment.date).tz(timezone || 'UTC', true)
        const now = moment().tz(timezone)
        if (filter === 'gt') {
            return appointmentDate.isAfter(now);
        } else if (filter === 'lt') {
            return appointmentDate.isBefore(now);
        }
        return true;
    });
    
    callback(null, { ok: true, data: filteredAppointments });
}

async function findAvailableDays(filter, callback) {
    let doctorIds = [];
    const month = filter.month

    if (filter.departmentId !== '0') {
      const doctorsInDepartment = await Doctor.find({ specialties: filter.departmentId }).select("_id");
      doctorIds = doctorsInDepartment.map(doc => doc._id);
    }

    const schedules = await Schedule.find({ doctor: { $in: doctorIds } }).populate('clinic');

    if (!schedules.length) {
      return callback(null, { ok: true, data: [] });
    }
  
    const appointments = await Appointment.find({
      doctor: { $in: doctorIds },
      $expr: {
        $eq: [{ $month: "$date" }, parseInt(month)]
      }
    }).select("doctor date startTime endTime");

    const availableDays = [];
  
    schedules.forEach(schedule => {
      appointments.filter(appointment => appointment.doctor.equals(schedule.doctor))

      const hours = availableHours(schedule, appointments)
      if(hours.length > 0) {
        if (!availableDays.includes(schedule.dayOfWeek)) {
          availableDays.push(schedule.dayOfWeek);
        }
      }
    })

    callback(null, { ok: true, data: availableDays });
}

async function findAvailableAppointments(departmentId, date, callback) {

    const doctorIds = await Doctor.find({ specialties: departmentId }).select("_id");
    
    if (!doctorIds.length) {
      return callback(null, { ok: true, data: [] }); 
    }
    
    const schedules = await Schedule.find({
      doctor: { $in: doctorIds },
      dayOfWeek: moment(date).day(),
    }).populate('doctor').populate('clinic');
  
    if (!schedules.length) {
      return callback(null, { ok: true, data: [] });
    }

    const appointments = await Appointment.find({
      doctor: { $in: doctorIds },
      date: date
    }).select("doctor startTime endTime date").populate('clinic');
  
    const availableAppointments = [];
  
    schedules.forEach(schedule => {
      appointments.filter(appointment => appointment.doctor.equals(schedule.doctorId))
      const hours = availableHours(schedule, appointments, date)
  
      availableAppointments.push({
          doctor: schedule.doctor,
          clinic: schedule.clinic,
          date,
          hours
      });
      }
    );
  
    return callback(null, { ok: true, data: availableAppointments });
  };

  async function createAppointment(appointmentData, callback) {

    const clinic = await Clinic.findById(appointmentData.clinic).select('timeZone')
    
    const appointments = await Appointment.find({patient: appointmentData.patient}).populate('clinic').populate('doctor')
    const dateTime = moment.tz(`${appointmentData.date} ${appointmentData.startTime}`, "YYYY-MM-DD HH:mm", clinic.timeZone || 'UTC');

    const existingAppointment = appointments.some(appointment => {
        const appointmentDate = moment(appointment.date)
        return appointmentDate.isSame(dateTime, 'minute');
    });

    if (existingAppointment) {
        return callback(null, { ok: false, message: 'יש לך כבר פגישה בזמן זה'});
    }

    appointmentData.date = moment.tz(`${appointmentData.date} ${appointmentData.startTime}`, "YYYY-MM-DD HH:mm", clinic.timeZone || 'UTC')
        .format();
    
    new Appointment(appointmentData).save()
        .then(function (model) {
          console.log(model)
            return callback(null, { ok: true, data: model });
        })
        .catch(function (err) {
            return callback(err);
        });
  }
  
  const addMinutes = (time, minutes) => {
    return getMoment(time)
      .add(minutes, "minutes")
      .format("HH:mm");
  };

  const getMoment = (time)=> {
    return moment(time, "HH:mm")
  }

  const availableHours = (schedule, appointments, date) => {
    const hours = [];
    const timezone = schedule.clinic.timeZone || 'UTC';
    let currentTime = schedule.startTime;

    while (currentTime < schedule.endTime) {
        const currentDateTime = moment.tz(`${date} ${currentTime}`, "YYYY-MM-DD HH:mm", timezone);
        const nowInClinicTZ = moment().tz(timezone);
        
        // Remove all hours before now
        if (currentDateTime.isBefore(nowInClinicTZ)) {
            currentTime = addMinutes(currentTime, 30);
            continue;
        }

        const endTime = addMinutes(currentTime, 30);
        
        // Check if the doctor has an appointment in the slot
        const isBusy = appointments.some(app => {
            const appStartDateTime = moment.tz(`${app.date} ${app.startTime}`, "YYYY-MM-DD HH:mm", app.clinic.timeZone || 'UTC');
            const appEndDateTime = moment.tz(`${app.date} ${app.endTime}`, "YYYY-MM-DD HH:mm", app.clinic.timeZone || 'UTC');
            const slotStartDateTime = moment.tz(`${date} ${currentTime}`, "YYYY-MM-DD HH:mm", timezone);
            const slotEndDateTime = moment.tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", timezone);
            
            return !(appStartDateTime.isAfter(slotEndDateTime) || 
                    appEndDateTime.isBefore(slotStartDateTime));
        });
        
        if (!isBusy) {
            hours.push({ startTime: currentTime, endTime });
        }
        
        currentTime = endTime;
    }
    return hours;
  }
  

async function cancelAppointment(appointmentId, callback) {
    try {
        const appointment = await Appointment.findByIdAndDelete(appointmentId);
        if (!appointment) {
            return callback(null, { ok: false, message: 'notFound' });
        }
        callback(null, { ok: true, data: appointment });
    } catch (err) {
        callback(err);
    }
}

module.exports = {
    createAppointment,
    getPatientAppointments,
    cancelAppointment,
    findAvailableAppointments,
    findAvailableDays,
};


