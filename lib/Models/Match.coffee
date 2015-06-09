mongoose = require 'mongoose'
Builder = require '../Components/MatchQueryBuilder/MatchQueryBuilder'
Schema = mongoose.Schema


schema = new Schema
  requests: [{
      player: type: Schema.Types.ObjectId, ref: 'Player'
      attributes: {},
      roles: [String],
      min: Number,
      max: Number
  }]
  open: type: Boolean, default: true
  requirements: {}
  size: type: Number, default: 0
  attributes: {}
  roles:
    need: {}
    delegations: {}

schema.methods =
  calculateAttributes: `function() {
    if (this.requests.length === 0) return;
    this.attributes = {};
    for (var attribute in this.requirements) {
      var requirement = this.requirements[attribute];
      if (requirement.type === 'same') {
        this.attributes[attribute] = this.requests[0].attributes[attribute];
      } else if (requirement.type === 'close') {
        var sum = 0;
        for (var i = 0, l = this.requests.length; i < l; i++) {
          sum += this.requests[i].attributes[attribute];
        }
        this.attributes[attribute] = sum / this.requests.length;
      } else if (requirement.type === 'interval') {
        var value = this.requests[0].attributes[attribute];
        for (var i = 0, l = requirement.intervals.length; i < l; i++) {
          var interval = requirement.intervals[i];
          if (value >= interval[0] && value <= interval[1]) {
            this.attributes[attribute] = interval;
            break;
          }
        }
      }
    }
  }`
  addRequest: (request) ->
    this.size += 1;
    this.requests.push(request);
    this.calculateAttributes();
  removeRequest: (request) ->
    this.size -= 1;
    this.calculateAttributes();



module.exports = mongoose.model 'Match', schema
