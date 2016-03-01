var jade = require('jade');

var cache = {};

exports.email = function (template, locals) {
  if (!cache['email']) {
    cache['email'] = jade.compileFile(__dirname + '/email.jade');
  }
  if (!cache['email'+template]) {
    cache['email'+template] = jade.compileFile(__dirname + '/email/'+template+'.jade');
  }
  return cache.email({content: cache['email'+template](locals)});
}

exports.clearCache = function () {
  cache = {};
}
