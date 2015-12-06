mongoose = require 'mongoose'
OPath = require 'object-path'

module.exports = (schema, options) ->
  schema.add({ modified_on: Date })

  # Create a field to store the redundant data
  for field, config of options
    schema.add({ "#{field}": Object })

  schema.methods.update = (path, value) ->
    if @get(path) isnt value

      if options.hasOwnProperty(path)
        # Keep track of changed references
        unless @updatedReferences? then @updatedReferences = {}
        @updatedReferences[path] = value
        path = "#{path}.id"
      else
        # Keep track of other changed fields
        unless @updatedFields? then @updatedFields = {}
        @updatedFields[path] = value
      @set path, value

  ###
  schema.pre 'save', (next) =>
    for field, config of options
      # get model
      # try to parallelise this
      # do this only for references that have changed
      # need to use a recursive function to capture all sub models and save them by key
      # which is used to apply the redundant fields to self
      mongoose.model(config.model).findOne _id: @["#{field}_id"], (err, model) =>
        key = field
        redundantModels[key] = model
  ###
