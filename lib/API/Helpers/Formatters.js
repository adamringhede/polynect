module.exports = {
  'application/json': function ( req, res, body, cb) {
      // Copied from restify/lib/formatters/json.js
      if (res.suppress_codes) {
        res.statusCode = 200;
      }
      if ( body instanceof Error ) {
          // snoop for RestError or HttpError, but don't rely on
          // instanceof
          formatError(body);

          if (res.suppress_codes) {
            res.statusCode = 200;
          } else {
            res.statusCode = body.statusCode || 500;
          }

          if ( body.body ) {
               body = {
                   status: 'error',
                   response_code: body.statusCode,
                   code: body.body.code || body.name,
                   message: body.body.message,
                   errors: body.body.errors
               };
           } else {
               body = {
                   status: 'error',
                   response_code: res.statusCode,
                   code: body.code || body.name, // Maybe we should use name instead of code
                   message: body.message,
                   errors: body.errors
               };
           }

      } else if ( Buffer.isBuffer( body ) ) {
          body = body.toString( 'base64' );
      }

      var data = JSON.stringify( body );
      res.setHeader( 'Content-Length', Buffer.byteLength( data ) );

      return cb(null, data);
  }
}

function formatError (err) {
  if (err.name === 'ValidationError') {
    var validationErrors = {};
    for (var key in err.errors) {
      validationErrors[key] = err.errors[key].message
    }
    err.errors = validationErrors;
    err.statusCode = 400
  }
}
