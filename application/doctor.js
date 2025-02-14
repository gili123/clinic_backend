const Doctor = require('../db/doctor');

const getAllDoctors = async (callback) => {
    try {
        const doctors = await Doctor.find();
        return callback(null, { ok: true, data: doctors })  ;
    } catch (error) {
        return callback(error);
    }
};

const create = async (doctorData, callback) => {
    new Doctor(doctorData).save()
            .then(function (models) {
                return callback(null, { ok: true, data: models });
            })
            .catch(function (err) {
                return callback(err);
            });
};

module.exports = {
    getAllDoctors,
    create,
};
