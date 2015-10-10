module.exports = function () {
  return function (req, res, next) {
    // If one were to query on an id directly, then it would not be found
    // since internally we use _id as the id.
    if ('id' in req.query) {
      req.query._id = req.query.id;
      delete req.query.id;
    }
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
