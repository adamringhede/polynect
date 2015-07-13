module.exports = (schema, options) ->
  schema.add({ modified_on: Date })

  schema.pre 'save', (next) ->
    this.modified_on = new Date
    next()

  if options and options.index
    schema.path('modified_on').index(options.index)
