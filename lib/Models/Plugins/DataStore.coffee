OPath = require 'object-path'
mongoose = require 'mongoose'
Schema = mongoose.Schema
Schemas = require '../Schemas'

module.exports = (schema, options) ->
  schema.add
    data: type: Schema.Types.Mixed, default: {}

  schema.methods.push =  (path, value) ->
    OPath.push(this, path, value);
  schema.methods.insert = (path, value, index) ->
    OPath.insert(this, path, value, index);
  schema.methods.empty = (path) ->
    OPath.empty(this, path);
