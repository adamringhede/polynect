module.exports = function () {
  return function (req, res, next) {
    res.error = error.bind(res);
    res.fail = fail.bind(res);
    res.sucess = success.bind(res);
    next();
  }
}


function error (code, message, error_code, data) {
  this.send(code, {
    response_code: this.suppress_codes ? code : null,
    status: 'error',
    message: message,
    code: error_code,
    data: data
  })
}

function fail (code, data) {
  this.send(code, {
    status: 'fail',
    data: data
  })
}

function success (code, data) {
  this.send(code, {
    status: 'success',
    data: data
  })
}
