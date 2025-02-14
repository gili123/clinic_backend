const Schedule = require('../db/schedule');

const create = async (scheduleData, callback) => {

    try {
        const existingSchedule = await Schedule.findOne({
            doctor: scheduleData.doctor,
            dayOfWeek: scheduleData.dayOfWeek
        });

        if (existingSchedule) {
            return callback(new Error('יש כבר לרופא משמרת באותו יום בשבוע'));
        }

    new Schedule(scheduleData).save()
        .then(function (models) {
            return callback(null, { ok: true, data: models });
        })
        .catch(function (err) {
            return callback(err);
        });

    } catch (err) {
        return callback(err);
    }
};

module.exports = {
    create
};
