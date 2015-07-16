module.exports = function (model) {
  return {
    id: model._id,
    email: model.email,
    username: model.username,
    firstname: model.firstname,
    lastname: model.lastname,
    role: model.role
  }
}
