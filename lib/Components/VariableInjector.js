module.exports = function (target, definitions) {
  var result = target;
  for (var variable in definitions) {
    var value = definitions[variable];
    if (typeof value !== 'string') {
      value = JSON.stringify(value);
    }
    result = result.replace(new RegExp( '\\$'+variable , 'g'), value);
  }
  return result;
}
