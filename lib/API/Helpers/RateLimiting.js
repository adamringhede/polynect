var redis = require("redis");
var throttle = require("tokenthrottle-redis");
var restify = require('restify');

var THROTTLE_EXPIRE = 60000; // 1 minute
var THROTTLE_DEFAULT_RATE_GAME = 20;
var THROTTLE_WINDOW = 1000;

var REDIS_HOST = process.env.POLYNECT_REDIS_HOST;
var REDIS_PORT = process.env.POLYNECT_REDIS_PORT;

var redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);

function createThrottle(options) {
  return throttle(options, redisClient)
}

function getIP(req) {
  var ipAddress;
  var forwardedIP = req.header('x-forwarded-for');
  if (forwardedIP) {
    var forwardedIPs = forwardedIP.split(',');
    ipAddress = forwardedIPs[0];
  }
  if (!ipAddress) {
    ipAddress = req.connection.remoteAddress;
  }
  return ipAddress;
}

module.exports = function () {
  return function (req, res, next) {
    if (req.user == null) {
      // Limiting by IP is not good since it may prevent normal usage
      // and would not prevent DDoS attacks
      next();
    } else if (req.user.role == 'player') {
      createThrottle({
        rate: THROTTLE_DEFAULT_RATE_GAME,
        expiry: THROTTLE_EXPIRE,
        window: THROTTLE_WINDOW
      }).rateLimit(req.user.game.id, function (err, exceeded) {
        if (exceeded) {
          next(new restify.errors.PaymentRequiredError("Rate limit exceeded. Please slow down."));
        } else {
          next();
        }
      });
    } else if (req.user.role == 'developer') {
      createThrottle({
        rate: 20,
        expiry: THROTTLE_EXPIRE,
        window: THROTTLE_WINDOW
      }).rateLimit(req.user._id, function (err, exceeded) {
        if (exceeded) {
          next(new restify.errors.PaymentRequiredError("Rate limit exceeded. If you need higher rate limits as a developer, then contact support."));
        } else {
          next();
        }
      });
    } else {
      next();
    }
  }
}
