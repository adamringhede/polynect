var Models = require('../../Models');
var Builder = require('../../Components/MatchQueryBuilder/MatchQueryBuilder');

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
  findMatch(game, player._id, attempts, builder, function (err, match) {
    if (err) {
      console.error(err);
      throw err;
    }
    if (!match) {
      // Create a new match
      match = new Models.Match.initWithGame(game);
    }
    var result = match.addRequest(builder.request);
    /* if result is false, then try to find another match and remove the allocation. If it is false, then there
     is something wrong with the matching algorithm. */

    match.save(function (err) {
      return callback(err, match);
    });
  });
}

function findMatch(game, player_id, attempts, builder, callback, attempt) {
  if (!attempt) attempt = 1;
  builder.setAttempt(attempt)
  var query = builder.build();
  query.$and.unshift({
    game_id: game._id
  });

  // to implement locking we can only try to match with one role at a time so that we know which
  // role in delegations to increment.

  Models.Match.findOne(query, function handler(err, model) {
    // if no model was found, we try the same thing with the next role.
    // after going though all roles, we increase the attempt number

    if (err) callback(err, null);
    else {
      if (!model && attempt < attempts) {
        attempt++;
        findMatch(game, player_id, attempts, builder, callback, attempt);
      } else {
        callback(null, model); // This will model as null if one cannot be found after all attempts
      }
    }
  });
}
