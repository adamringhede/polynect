var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/polynect-test');
module.exports = require('./lib/Models');
