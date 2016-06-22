var Models = require('../../Models');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');
var async = require('async');

var MATCH_RESERVATION_TIMEOUT = 50;

exports.findMatch = function(params, callback) {
  var game = params.game,
      values = params.values,
      player = params.player,
      character = params.character;

  var attempts = game.matchmaking_config.attempts;
  var builder = new Builder(
    game.matchmaking_config,
    values, // Input values
    player, // Player
    character || null, // Character
    'attributes'
  );
  if (builder.hasErrors()) {
    return callback({
      code: 400,
      message: 'Could not create a matchmaking request',
      data: builder.getErrors()
    });
  }
  findMatch(game, player.player_id || player._id, attempts, builder, function (err, match) {

    if (err) {
      console.error(err);
      throw err;
    }
    if (!match) {
      // Create a new match
      match = new Models.Match.initWithGame(game);
    }
    // Adding a request that may already be added in the update, should not make
    // a difference.
    match.addRequest(builder.request, builder.config);
    match.clearReservation();
    match.calculateStatus();

    /* if result is false, then try to find another match and remove the allocation. If it is false, then there
     is something wrong with the matching algorithm. */

    match.save(function (err) {
      if (typeof callback == 'function') {
        return callback(err, match);
      }
    });
  });
}

function findMatch(game, player_id, attempts, builder, callback, attempt) {
  if (!attempt) attempt = 1;
  builder.setAttempt(attempt)
  var roles = builder.config.roles && Object.keys(builder.config.roles.limits).length > 0 ? builder.getPlayerRoles() : false;

  // TODO When we implement multiple players per request
  // it should be enough to just change the size in inc
  // and use $each to add multiple requests. So one request will need to be
  // copied to one for each player in the request.
  //
  // And for the query part, all requests need to match.
  // However, for roles, it is not possible to match a group of players
  // with another match. This is because we don't change the state of the query
  // for possible delegation and the next role check would use an invalid state.
  // So for roles we have to just create the match and let other users join.
  // We may still be able, though, to create a seperate algorithm for matching
  // groups with roles with other existing matches.
  //
  // Remember, that when we try to match a group of players, we have to make sure
  // that the players actually match with eachother or it will not find a match
  // so a match is created that may not be matchable with other users. We should
  // test for this so the the client does not have to and send an appropriate error.

  // TODO Implement removal of requests from matches.

  // TODO Add a worker to make matchmaking requests on behalf of the client with
  // otpimal delays before creating the match. The reason for this is because
  // we don't want to put more logic than necessary on the client. Until we've found
  // a match we should just respond with the request and it's attributes. By doing this
  // we can use locks if we want to, however, locks will still affect performance badly.
  // This poses architectural problems. It this reliable? What happens if the server goes down?
  //
  // This is also an apportunity to send matchmaking requests to multiple matcmaking servers for the game
  // so that we can reach greater scale.

  // TODO Implement handlers/hooks for some actions. For instance, matchCreated,
  // playerLeft, etc. So if a player leaves the match, it could be penalized or something.
  // This is maybe not necessary though since much of it could be done on the client.
  // Still we would need some things like setPropertyIfNotSet to set a selected multiplayer
  // server.

  var update = {
    '$inc': {
      size: 1
    },
    '$addToSet': {
      requests: builder.request
    }
  };

  if (roles) {
    var match = null;
    async.eachSeries(roles, function (role, next) {
      builder.setRole(role);
      var query = builder.build();
      query.$and.unshift({
        game_id: game._id
      });

      if (builder.config.roles.allow_switching) {
        if (!update['$set']) update['$set'] = {};
        update['$set']['reserved'] = true;
        update['$set']['reserved_at'] = Date.now();
        query.$and.unshift({
          '$or': [{reserved: false}, {reserved_at: {'$lte': Date.now() -  MATCH_RESERVATION_TIMEOUT}}]
        });
      } else {
        // If we don't allow switching, we can allocate the spot without reservation.
        update['$addToSet']['roles.delegations.' + role] = {
          id: player_id,
          roles: roles
        };
      }
      Models.Match.findOneAndUpdate(query, update, {'new': true, sort: {startedMatching: 1}}, function handler(err, model) {
        // if no model was found, we try the same thing with the next role.
        // after going though all roles, we increase the attempt number (lne 145)
        if (err) next(err);
        else if (model != null) {
          match = model;
          next('done');
        } else {
          next();
        }
      });
    }, function (err) {
      if (match != null) { // A match was found
        callback(null, match);
      } else if (err != 'done') { // An error occured
        callback(err, null);
      } else if (attempt < attempts) { // Could not find any match
        attempt++;
        findMatch(game, player_id, attempts, builder, callback, attempt);
      } else { // No error and no match after all attempts.
        callback(null, null);
      }
    });
  } else {
    var query = builder.build();
    query.$and.unshift({
      game_id: game._id
    });
    Models.Match.findOneAndUpdate(query, update, {'new': true, sort: {startedMatching: 1}}, function handler(err, model) {
      if (err) callback(err, null);
      else if (!model && attempt < attempts) {
        attempt++;
        findMatch(game, player_id, attempts, builder, callback, attempt);
      } else {
        callback(null, model); // This will model as null if one cannot be found after all attempts
      }
    });
  }

}
