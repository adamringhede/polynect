module.exports = function (model) {
  return {
    id: model._id,
    name: model.name,
    client_id: model.client_id,
    secret: model.secret,
    holder: model.holder,
    redirect_uri: model.redirect_uri,
    grants: model.grants
  }
}
