module.exports = function () {
  return function (req, res, next) {
    res.suppress_codes = req.query.suppress_response_codes ? true : false;
    delete req.query.suppress_response_codes;
    next();
  }
}
