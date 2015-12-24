var redis = require("redis");
var throttle = require("tokenthrottle-redis");
var restify = require('restify');
var Models = require('../../Models');

var THROTTLE_EXPIRE = 60000; // 1 minute
var THROTTLE_DEFAULT_RATE_GAME = 20;
var THROTTLE_WINDOW = 1000;
var THROTTLE_GAME_RATE_CACHE = 1000 * 60 * 10; // 10 minutes

var REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
  var rtg   = require("url").parse(REDIS_URL);
  var redisClient = redis.createClient(rtg.port, rtg.hostname);
  redisClient.auth(rtg.auth.split(":")[1]);
} else {
  var redisClient = redis.createClient();
}


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

var gameLimitCache = {};
function getGameRateLimit(gameId, callback) {
  gameId = gameId.toString();
  if (gameLimitCache[gameId] && gameLimitCache[gameId].expires < Date.now()) {
    return callback(gameLimitCache[gameId].limit);
  } else {
    Models.Game.findOne({_id: gameId}, function (err, game) {
      gameLimitCache[gameId] = {
        expires: Date.now() + THROTTLE_GAME_RATE_CACHE,
        limit: game.rate_limit || THROTTLE_DEFAULT_RATE_GAME
      };
      return callback(gameLimitCache[gameId].limit);
    });
  }
}

module.exports = function () {
  return function (req, res, next) {
    if (req.user == null) {
      // Limiting by IP is not good since it may prevent normal usage
      // and would not prevent DDoS attacks
      next();
    } else if (req.user.role == 'player') {
      getGameRateLimit(req.user.game.id, function (limit) {
        createThrottle({
          rate: limit,
          burst: limit * 2,
          expiry: THROTTLE_EXPIRE,
          window: THROTTLE_WINDOW
        }).rateLimit(req.user.game.id, function (err, exceeded) {
          if (exceeded) {
            next(new restify.errors.PaymentRequiredError("Rate limit exceeded. Please slow down."));
          } else {
            next();
          }
        });
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
