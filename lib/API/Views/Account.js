module.exports = function (model) {
  return {
    id: model._id,
    email: model.email,
    firstname: model.firstname,
    lastname: model.lastname,
    role: model.role
  }
}
