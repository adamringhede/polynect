mongoose = require 'mongoose'
Plugins = require './Plugins'
Schema = mongoose.Schema

schema = new Schema
  url: type: String, required: true
  type: type: String, enum: ['init'], reqired: true
  secret: type: String
  use_secret: type: Boolean, default: false

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
