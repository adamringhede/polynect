mongoose = require 'mongoose'
Fixtures = require 'pow-mongoose-fixtures'

exports.connected = false

exports.connection = null

exports.init = (dbURL) ->
  return if exports.connected
  unless dbURL? then dbURL = process.MONGODB_URL
  mongoose.connect dbURL
  exports.connection = mongoose.connection
  exports.connected = true

exports.load = `function (fixtures, callback) {
  var f = {};
  Fixtures.load(fixtures, mongoose.connection, function () {
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
            if (err) throw err;
            f[modelName][i] = model;
            count -= 1;
            if (count == 0) {
              if (typeof callback === 'function') callback(f);
            }
          });
        }
      });
    });
    if (non_empty_count == 0 && typeof callback === 'function') callback(f);
  });
};`
