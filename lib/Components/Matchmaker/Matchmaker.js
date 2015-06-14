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
    {}, // Character
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
      return callback({
        code: 500,
        message: 'Database failure'
      });
    }
    if (!match) {
      // Create a new match
      match = new Models.Match();
      match.requirements = game.matchmaking_config.attributes
      match.game = game._id;
    }
    match.addRequest(builder.request);
    match.save(function (err) {
      return callback(null, match);
    });
  });
}

function findMatch(game, player_id, attempts, builder, callback, attempt) {
  if (!attempt) attempt = 1;
  builder.setAttempt(attempt)
  var query = builder.build();
  query.$and.unshift({
    game: game._id
  });
  Models.Match.findOne(query, function handler(err, model) {
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
