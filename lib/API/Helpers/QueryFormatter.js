module.exports = function () {
  return function (req, res, next) {
    for (key in req.query) {
      var value = req.query[key].toLowerCase();
      if (value == 'true' || value == 'false') {
        req.query[key] = value == 'true';
      } else if (isNumeric(value)) {
        req.query[key] = parseInt(value, 10);
      }
    }
    next();
  }
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}
