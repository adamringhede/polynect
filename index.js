var mongoose = require('mongoose');
var Models = require('./lib/Models');

Models.init = function (uri, options) {
  mongoose.connect(uri, options);
}
module.exports = Models;
