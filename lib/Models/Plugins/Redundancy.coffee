mongoose = require 'mongoose'
OPath = require 'object-path'
async = require 'async'

module.exports = (schema, options) ->
  schema.add({ modified_on: Date })

  # Create a field to store the redundant data
  for field, config of options
    schema.add({ "#{field}": Object })

  schema.methods.update = (path, value, force = false) ->
    if @get(path) isnt value or force

      if options.hasOwnProperty(path)
        # TODO Check that the value is a valid identifier
        unless @updatedReferences? then @updatedReferences = {}
        @updatedReferences[path] = value
        path = "#{path}.id"
      else
        # Keep track of other changed fields
        unless @updatedFields? then @updatedFields = {}
        @updatedFields[path] = value
      @set path, value



  schema.pre 'save', (next) ->
    # If a model is created with references set on instantiation, then
    # this part takes care of initiating the updatedReferences object
    if @isNew
      for field, config of options
        if @[field]?
          if not @updatedReferences?[field]?
            @update field, @[field], true
    # No need to load references if there are no changes
    unless @updatedReferences? then return next()
    # Load references in parallel.
    async.forEachOf options, (config, field, callback) =>
      if not @updatedReferences[field]? then return callback()
      mongoose.model(config.model).findOne _id: @[field].id, (err, model) =>
        if model?
          for redundant_field in config?.fields
            @set("#{field}.#{redundant_field}", model.get(redundant_field))
        else
          @[field] = null
        callback()
    , next
