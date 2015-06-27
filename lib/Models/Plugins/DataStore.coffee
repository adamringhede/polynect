OPath = require 'object-path'

module.exports = (schema, options) ->
  schema.add
    data: {}

  schema.methods.push =  (path, value) ->
    OPath.push(this, path, value);
  schema.methods.insert = (path, value, index) ->
    OPath.insert(this, path, value, index);
  schema.methods.empty = (path) ->
    OPath.empty(this, path);
