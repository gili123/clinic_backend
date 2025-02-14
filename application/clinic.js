const clinic = require('../db/clinic')

module.exports = {
    getAllClinics: async function(cb) {
        const clinics = await clinic.find().catch((err) => {
            return cb(err)
        })
        
        return cb(null, {ok: true, data: clinics})
    },

    create: function(clinicData, callback) {
        new clinic(clinicData).save()
            .then(function (models) {
                return callback(null, { ok: true, data: models });
            })
            .catch(function (err) {
                return callback(err);
            });
    }
}


