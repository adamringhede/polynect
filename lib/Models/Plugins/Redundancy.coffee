mongoose = require 'mongoose'
OPath = require 'object-path'
async = require 'async'

module.exports = (schema, options) ->
  schema.add({ modified_on: Date })
  # Create a field to store the redundant data
  unless mongoose.redundancyConfig? then  mongoose.redundancyConfig = {}
  for field, config of options.references
    schema.add({ "#{field}": Object })
    unless mongoose.redundancyConfig[config.model]? then mongoose.redundancyConfig[config.model] = []
    mongoose.redundancyConfig[config.model].push({
      path: field,
      model: options.model,
      fields: config.fields
    })
    for ref_field, ref_config of config.references
      unless mongoose.redundancyConfig[ref_config.model]? then mongoose.redundancyConfig[ref_config.model] = []
      mongoose.redundancyConfig[ref_config.model].push({
        path: "#{field}.#{ref_field}",
        model: options.model,
        fields: ref_config.fields
      })


  schema.methods.update = (path, value, force = false) ->
    if @get(path) isnt value or force
      # Keep track of changed fields and values
      unless @updatedFields? then @updatedFields = {}
      @updatedFields[path] = value

      # Keep track of changed references
      if options.references.hasOwnProperty(path)
        # TODO Check that the value is a valid identifier
        unless @updatedReferences? then @updatedReferences = {}
        @updatedReferences[path] = value
        path = "#{path}.id"

      @set path, value

  # Loads references models and sets redundant data
  schema.pre 'save', (next) ->
    # If a model is created with references set on instantiation, then
    # this part takes care of initiating the updatedReferences object
    if @isNew
      for field, config of options.references
        if @[field]?
          if not @updatedReferences?[field]?
            @update field, @[field], true
    # No need to load references if there are no changes
    unless @updatedReferences? then return next()
    # Load references in parallel.
    async.forEachOf options.references, (config, field, callback) =>
      if not @updatedReferences[field]? then return callback()
      # Construct projection by fields and references
      select = config.fields.slice()
      for ref_name, ref of config.references
        select.push ref_name
      # TODO Create a recursive function that does this. It should be simple enough
      mongoose.model(config.model).where({_id: @[field].id}).select(select.join(' ')).findOne (err, model) =>
        if model?
          for redundant_field in config?.fields
            @set("#{field}.#{redundant_field}", model.get(redundant_field))
          async.forEachOf config.references, (reference, ref_field, callback2) =>
            mongoose.model(reference.model).where({_id: model[ref_field].id}).findOne (err, reference_model) =>
              if reference_model?
                for ref_redundant_field in reference.fields
                  @set("#{field}.#{ref_field}.#{ref_redundant_field}", reference_model.get(ref_redundant_field))
                @set("#{field}.#{ref_field}.id", reference_model._id)
              else
                @[field][ref_field] = null
              callback2()
          , callback
        else
          @[field] = null
          callback()
    , next

  # Updates the redundant data of other models referencing this one
  schema.pre 'save', (next) ->
    # There should be no model subscribing to this one if this one is new,
    # so there is no need to execute an update
    return next() if @isNew
    # NOTE In a production environment there should be no need to wait for
    # the update to finish. Instead it should use no write concern and call
    # next/callback without waiting for the update to finish TODO
    async.each mongoose.redundancyConfig[options.model], (subscriber, callback) =>
      $set = {}
      update = false
      for field in subscriber.fields
        if @updatedFields?[field]?
          update = true
          $set["#{subscriber.path}.#{field}"] = @[field]
      if update
        mongoose.model(subscriber.model).update "#{subscriber.path}.id": @_id, {$set: $set}, () => callback()
      else
        callback()
    , next