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

    if(filter.departmentId === '0'){
      return callback(null, { ok: true, data: [] });
    }

    const doctorsInDepartment = await Doctor.find({ specialties: filter.departmentId }).select("_id");
    const doctorIds = doctorsInDepartment.map(doc => doc._id);
    
    const schedules = await Schedule.find({ doctor: { $in: doctorIds } }).select('dayOfWeek');
    const availableDays = schedules.map(schedule => schedule.dayOfWeek)

    callback(null, { ok: true, data: availableDays });
}

async function findAvailableAppointments(departmentId, date, callback) {

    const doctors = await Doctor.find({ specialties: departmentId }).select("_id")
    const doctorIds = doctors.map(doc => doc._id)

    if (!doctorIds.length) {
      return callback(null, { ok: true, data: [] })
    }
    
    const schedules = await Schedule.find({
      doctor: { $in: doctorIds },
      dayOfWeek: moment(date).day(),
    }).populate('doctor').populate('clinic')
  
    if (!schedules.length) {
      return callback(null, { ok: true, data: [] })
    }

    const appointments = await Appointment.find({
      doctor: { $in: doctorIds },
    }).select("doctor startTime endTime date").populate('clinic')
  
    const availableAppointments = []

    schedules.forEach(schedule => {
      const filteredApp = appointments.filter(appointment => appointment.doctor.equals(schedule.doctor._id) && moment(appointment.date).tz(schedule.clinic.timeZone || 'UTC').format('YYYY-MM-DD') === date)
      const hours = availableHours(schedule, filteredApp, date)

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
      .add(minutes, "minutes");
  };

  const getMoment = (time) => {
    return moment(time, "HH:mm");
  };

  const availableHours = (schedule, appointments, date) => {
    const hours = [];
    const timezone = schedule.clinic.timeZone || 'UTC';
    let currentTime = moment.tz(`${date} ${schedule.startTime}`, "YYYY-MM-DD HH:mm", timezone);

    while (currentTime.isBefore(moment.tz(`${date} ${schedule.endTime}`, "YYYY-MM-DD HH:mm", timezone))) {
        const currentDateTime = moment.tz(`${date} ${currentTime.format("HH:mm")}`, "YYYY-MM-DD HH:mm", timezone);
        const nowInClinicTZ = moment().tz(timezone || 'UTC');

        // Remove all hours before now
        if (currentDateTime.isBefore(nowInClinicTZ)) {
            currentTime = addMinutes(currentTime, 30);
            continue;
        }
        
        const endTime = addMinutes(currentTime, 30);
        
        // Check if the doctor has an appointment in the slot
        const isBusy = appointments.some(app => {
            const appStartDateTime = moment(`${app.startTime}`, "HH:mm");
            const appEndDateTime = moment(`${app.endTime}`, "HH:mm");
            const slotStartDateTime = moment(`${currentTime.format("HH:mm")}`, "HH:mm");
            const slotEndDateTime = moment(`${endTime.format("HH:mm")}`, "HH:mm");

            return !(appStartDateTime.isSameOrAfter(slotEndDateTime) || 
                    appEndDateTime.isSameOrBefore(slotStartDateTime));
        });

        if (!isBusy) {
            hours.push({ startTime: currentTime.format("HH:mm"), endTime: endTime.format("HH:mm") });
        }
        
        currentTime = endTime;
    }
    return hours;
  };
  

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


