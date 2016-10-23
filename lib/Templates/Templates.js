var jade = require('jade');
var juice = require('juice');

var cache = {};

exports.email = function (template, locals) {
  if (!cache['email']) {
    cache['email'] = jade.compileFile(__dirname + '/email.jade');
  }
  if (!cache['email'+template]) {
    cache['email'+template] = jade.compileFile(__dirname + '/email/'+template+'.jade');
  }
  let html = cache.email({content: cache['email'+template](locals)});
  let inlined = juice(html);
  return inlined;
};

exports.clearCache = function () {
  cache = {};
}
