(function() {
  var file, files, fs, hasModuleMain, i, j, len, len1, model, models, moduleName, parts;

  fs = require('fs');

  files = fs.readdirSync(__dirname);

  if (files == null) {
    throw 'Could not require models';
  }

  parts = __dirname.split('/');

  moduleName = parts[parts.length - 1];


  hasModuleMain = false;

  for (i = 0, len = files.length; i < len; i++) {
    file = files[i];
    if (file === (moduleName + ".js")) {
      hasModuleMain = true;
      break;
    }
  }

  if (hasModuleMain) {
    models = require('./' + file.replace(/(.js)/, ''));
  } else {
    models = {};
  }


  for (j = 0, len1 = files.length; j < len1; j++) {
    file = files[j];
    if (file !== 'index.js' && /(.js)$/.test(file) && /^[A-Z]+/.test(file[0]) && file !== (moduleName + ".js")) {
      model = file.replace(/(.js)/, '');
      models[model] = require("./" + model);
    } else if (!/\./.test(file) && /^[A-Z]+/.test(file[0])) {
      models[file] = require("./" + file);
    }
  }

  module.exports = models;

}).call(this);
