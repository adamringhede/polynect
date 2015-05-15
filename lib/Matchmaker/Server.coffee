socketIO = require 'socket.io'
Models = require '../Models'
Matchmaker = require './Matchmaker'

setRequestListeners = (socket, request) ->
  if request.party?
    socket.emit 'matched', request.party.getSummary()
  request.on 'initial match', (partyMatch) ->
    socket.emit 'matched', partyMatch.getSummary()
  request.on 'change', (partyMatch) ->
    socket.emit 'update', partyMatch.getSummary()
  request.on 'disbanded', (partyMatch) ->
    # this is when all other requests quit
  request.on 'finished', (partyMach) ->
    # emit the room id, room token, and match data


setListeners = (socket, matchmaker) ->
  socket.on 'watch', (data) ->
    request = matchmaker.getRequest data.request_id
    setRequestListeners socket, request
  socket.on 'initiate', (data) ->
    requestModel = new Models.MatchmakingRequest(data.request)
    requestModel.save()
    matchmaker.put new Request requestModel
    socket.emit 'initiate.response', requestModel.view()
  socket.on 'start', (data) ->
    requestModel = new Models.MatchmakingRequest(data.request)
  socket.on 'quit', (data) ->
    matchmaker.remove data.request_id, yes

authenticate = (socket, callback) ->
  socket.on 'authenticate', (data) ->
    if data.token?
      console.log "Trying to authenticate using token " + data.token
      Models.Player.find token: data.token, (err, player) ->
        if err? then socket.emit 'authorization', result: false, message: 'invalid token'
        socket.authed = true
        socket.player = player
        socket.emit 'authorization', result: true, player: username: player.username, rooms: player.rooms
        callback?()
    else if data.username? and data.password?
      console.log "Trying to authenticate #{data.username} using credentials"
      Models.Player.find token: data.token, (err, player) ->
        if err? then socket.emit 'authorization', result: false, message: 'invalid credentials'
        socket.authed = true
        socket.player = player
        socket.emit 'authorization', result: true, player: username: player.username, rooms: player.rooms
        callback?()
    else socket.emit 'authorization', result: false, message: 'bad request'



###
config:
  port: Number
###

init = (config) ->

  io = socketIO.listen config.port
  console.log "Matchmaker listening on " + config.port
  matchmakers = {}

  Models.Game.find active: true, (err, games) ->
    for game, i in games
      matchmakers[game._id] = matchmaker = new Matchmaker
      console.log "Starting to matchmake for " + game.name
      io.of(game.alias).on 'connection', (socket) ->
        authenticate socket, ->
          setListeners socket, matchmaker


module.exports = init: init
