const department = require('../db/department')

module.exports = {
    getAll: async function(cb) {
        const departments = await department.find({}).catch((err) => {
            return cb(err)
        })
        
        return cb(null, {ok: true, data: departments})
    },

    create: function(departmentData, callback) {
        new department(departmentData).save()
            .then(function (models) {
                return callback(null, { ok: true, data: models });
            })
            .catch(function (err) {
                return callback(err);
            });
    }
}
