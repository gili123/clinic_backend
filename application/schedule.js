const Schedule = require('../db/schedule');
const moment = require('moment-timezone');

const create = async (scheduleData, callback) => {

    const startTime = moment(scheduleData.startTime, "HH:mm")
    const endTime = moment(scheduleData.endTime, "HH:mm")
    let schedules = [scheduleData]
    if(startTime.isAfter(endTime)){
        schedules = splitSchedule(scheduleData)
    }

    const daysOfWeek = schedules.map(schedule => schedule.dayOfWeek)

    try {
        const existingSchedule = await Schedule.findOne({
            doctor: scheduleData.doctor,
            dayOfWeek: daysOfWeek
        });

        if (existingSchedule) {
            return callback(new Error('יש כבר לרופא משמרת באותו יום בשבוע'));
        }

        const savedSchedules = await Promise.all(schedules.map(schedule => {
            return new Schedule(schedule).save()
        }));

        return callback(null, { ok: true, data: savedSchedules });

    } catch (err) {
        return callback(err);
    }
};

function splitSchedule(scheduleData){
    const startOfDay = moment(scheduleData.startTime, "HH:mm").startOf('day');
    let fregments = []
    startTime = startOfDay.format("HH:mm")

    const firstSegment = {
        ...scheduleData,
        endTime: startTime == "00:00" ? "23:59" : startTime
    };
    
    const secondSegment = {
        ...scheduleData,
        dayOfWeek: (scheduleData.dayOfWeek + 1) % 7,
        startTime: startOfDay.format("HH:mm"),
        endTime: scheduleData.endTime == "00:00" ? "23:59" : scheduleData.endTime
    };

    if(firstSegment.startTime !== secondSegment.endTime){
        fregments.push(firstSegment)
    } 
    if (secondSegment.startTime !== scheduleData.endTime){
        fregments.push(secondSegment)
    }

    return fregments
}

module.exports = {
    create
};
