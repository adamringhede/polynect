module.exports = function (model) {
  return {
    id: model._id,
    status: model.status,
    created: model.created,
    status: model.status,
    roles: model.roles,
    requirements: model.requirements
  }
}
