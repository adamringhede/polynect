mongoose = require 'mongoose'
Fixtures = require 'pow-mongoose-fixtures'

exports.connected = false

exports.connection = null

exports.init = (dbURL = process.env.POLYNECT_MONGO_URI || 'mongodb://localhost/polynect-test') ->
  return if exports.connected
  mongoose.connect dbURL
  #mongoose.set('debug', true)

  exports.connection = mongoose.connection
  exports.connected = true


exports.loadFixtures = Fixtures.load
exports.load = `function (fixtures, callback) {
  var f = {};
  Fixtures.load(fixtures, mongoose.connection, function (err) {
    if (err) throw err;
    var count = 0;
    var non_empty_count = 0;
    if (Object.keys(fixtures).length === 0 && typeof callback === 'function') callback(f);
    Object.keys(fixtures).forEach(function (modelName) {
      f[modelName] = {};
      if (Object.keys(fixtures[modelName]).length > 0) {
        non_empty_count += 1;
      }
      Object.keys(fixtures[modelName]).forEach(function (i) {
        if (fixtures[modelName][i]['_id']) {
          count += 1;
          mongoose.model(modelName).findOne({_id: fixtures[modelName][i]['_id']}, function (err, model) {
            model.__forceUpdate = true;
            model.save(function () {
              if (err) throw err;
              f[modelName][i] = model;
              count -= 1;
              if (count == 0) {
                if (typeof callback === 'function') callback(f);
              }
            })
          });
        }
      });
    });
    if (non_empty_count == 0 && typeof callback === 'function') callback(f);
  });
};`
