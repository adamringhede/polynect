mongoose = require 'mongoose'
OPath = require 'object-path'
async = require 'async'

setSubscribers = (modelName, references, path = null) ->
  basePath = if path? then "#{path}." else ""
  for field, config of references
    unless mongoose.redundancyConfig[config.model]? then mongoose.redundancyConfig[config.model] = []
    unless config.fields? then config.fields = []
    mongoose.redundancyConfig[config.model].push
      path: "#{basePath}#{field}"
      model: modelName
      fields: config.fields
    setSubscribers modelName, config.references, "#{basePath}#{field}"

module.exports = (schema, options) ->
  # Create fields to store the redundant data
  for field, config of options.references
    schema.add({ "#{field}": Object })
    schema.add({ "#{field}_id": mongoose.Schema.Types.ObjectId })

  # Compose a redundancy config of reference subscribers
  unless mongoose.redundancyConfig? then  mongoose.redundancyConfig = {}
  setSubscribers options.model, options.references

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
        @set "#{path}_id", value
        @set "#{path}.id", value
      else
        #@set path, value # @set ignores attributes which are not in the model which makes it possible to set the password
        @[path] = value
      true


  loadData = (self, baseModel, path, references, done) ->
    unless references? then return done()
    async.forEachOf references, (config, field, callback) =>
      unless config.fields then config.fields = []

      # Construct projection by fields and references
      select = config.fields.slice()
      for ref_name, ref of config.references
        select.push ref_name

      basePath = if path? then "#{path}." else ""
      unless baseModel[field]?
        baseModel[field] = null
        return callback()
      mongoose.model(config.model).where({_id: baseModel[field].id}).select(select.join(' ')).findOne (err, model) =>
        if model?
          for redundant_field in config?.fields
            self.set("#{basePath}#{field}.#{redundant_field}", model.get(redundant_field))
          self.set("#{basePath}#{field}.id", model._id)
          loadData self, model, "#{basePath}#{field}", config.references, callback
        else
          allowNullReferences = true
          unless allowNullReferences then baseModel[field] = null
          callback()
    , done

  schema.pre 'validate', (next) ->
    if @__forceUpdate
      unless @updatedReferences? then @updatedReferences = {}
      for field, config of options.references
        if @[field]?.id?
          @updatedReferences[field] = @[field].id
    next()

  # Loads references models and sets redundant data
  schema.pre 'validate', (next) ->
    # If a model is created with references set on instantiation, then
    # this part takes care of initiating the updatedReferences object
    if @isNew
      for field, config of options.references
        unless config.fields? then config.fields = []
        if @[field]?
          if not @updatedReferences?[field]?
            @update field, @[field], true

    # No need to load references if there are no changes
    unless @updatedReferences? then return next()
    references = {}
    for name, reference of options.references
      if @updatedReferences[name]?
        references[name] = reference
        @["#{field}_id"] = @updatedReferences[name]
    # Load references in parallel.
    loadData this, this, null, references, next

  # Updates the redundant data of other models referencing this one
  schema.pre 'save', (next) ->
    # There should be no model subscribing to this one if this one is new,
    # so there is no need to execute an update
    return next() if @isNew
    # TODO In a production environment there should be no need to wait for
    # the update to finish. Instead it should use no write concern and call
    # next/callback without waiting for the update to finish
    async.each mongoose.redundancyConfig[options.model], (subscriber, callback) =>
      $set = {}
      update = false
      for field in subscriber.fields
        if @updatedFields?[field]?
          update = true
          $set["#{subscriber.path}.#{field}"] = @[field]
      if update
        mongoose.model(subscriber.model).update "#{subscriber.path}.id": @_id,
          {$set: $set}, {multi: true, writeConcern: false}, () => callback()
      else
        callback()
    , next
