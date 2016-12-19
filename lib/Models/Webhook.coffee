mongoose = require 'mongoose'
Plugins = require './Plugins'
rp = require 'request-promise'
sha1 = require 'sha1'
Schema = mongoose.Schema

Hook = type: Boolean, required: true, default: false

schema = new Schema
  url: type: String, required: true
  enable:
    match_init: Hook

schema.methods.send = (event, payload, attempts = 3) ->
  attempts -= 1
  if (attempts <= 0)
    return Promise.resolve(false)
  data = JSON.stringify(Object.assign({event: event}, payload))
  signature = sha1(data)
  return rp({
    method: 'POST',
    uri: this.url,
    body: data,
    resolveWithFullResponse: true,
    headers: {
      'X-Hub-Signature': signature
    }
  })
  .then((response) => true)
  .catch((response) =>
    return this.send(event, payload, attempts)
  )


### Example delivery


# Init
{
  "hook": "match.init",
  "match": {
    <match object using api view>
  },
  "game": {
    "id": <id of game>
    ... rest of game view
  }
}

# Match update
{
  "hook": "match.update",
  "match": {
    <match object using api view>
  },
  "game": {
    "id": <id of game>
    ... rest of game view
  }
}

# Match close is sent after all players have left.
# It can be useful for distributed applications in which the node that makes the request to leave a match, is not able to deallocate necessary resources. 
{
  "hook": "match.close",
  "match": {
    <match object using api view>
  },
  "game": {
    "id": <id of game>
    ... rest of game view
  }
}



###


schema.plugin Plugins.Redundancy,
  model: 'Webhook'
  references:
    game:
      model: 'Game'
      fields: ['name']
      references:
        developer:
          model: 'Account'
          fields: ['firstname']

module.exports = mongoose.model 'Webhook', schema
